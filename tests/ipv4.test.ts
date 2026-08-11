import { describe, expect, it } from 'vitest';
import {
  addressClass,
  broadcastAddress,
  classifyAddress,
  firstUsable,
  formatIp,
  lastUsable,
  maskFromPrefix,
  networkAddress,
  parseIp,
  prefixForHosts,
  prefixForSubnets,
  prefixFromMask,
  subdivide,
  totalAddresses,
  usableHosts,
  usableHostsRfc3021,
  wildcardMask,
} from '../src/games/ipv4';

describe('parse and format', () => {
  it('round-trips a dotted quad', () => {
    for (const ip of ['0.0.0.0', '255.255.255.255', '192.168.1.1', '10.0.0.1', '172.16.254.9']) {
      expect(formatIp(parseIp(ip))).toBe(ip);
    }
  });

  it('handles the high bit without sign errors', () => {
    // 255.x parses above 2^31, where a signed shift would produce a negative.
    expect(formatIp(parseIp('255.255.255.255'))).toBe('255.255.255.255');
    expect(parseIp('255.255.255.255')).toBe(4294967295);
  });

  it('rejects malformed input', () => {
    for (const bad of ['1.2.3', '1.2.3.4.5', '256.1.1.1', 'a.b.c.d', '1.2.3.-1', '']) {
      expect(() => parseIp(bad)).toThrow();
    }
  });
});

describe('masks', () => {
  it('produces the standard masks', () => {
    expect(formatIp(maskFromPrefix(8))).toBe('255.0.0.0');
    expect(formatIp(maskFromPrefix(16))).toBe('255.255.0.0');
    expect(formatIp(maskFromPrefix(24))).toBe('255.255.255.0');
    expect(formatIp(maskFromPrefix(26))).toBe('255.255.255.192');
    expect(formatIp(maskFromPrefix(30))).toBe('255.255.255.252');
  });

  it('handles /0 and /32, where a naive shift breaks', () => {
    expect(formatIp(maskFromPrefix(0))).toBe('0.0.0.0');
    expect(formatIp(maskFromPrefix(32))).toBe('255.255.255.255');
  });

  it('round-trips prefix to mask and back', () => {
    for (let prefix = 0; prefix <= 32; prefix++) {
      expect(prefixFromMask(maskFromPrefix(prefix))).toBe(prefix);
    }
  });

  it('rejects a non-contiguous mask', () => {
    expect(() => prefixFromMask(parseIp('255.255.0.255'))).toThrow(/contiguous/);
  });

  it('computes the wildcard mask', () => {
    expect(formatIp(wildcardMask(24))).toBe('0.0.0.255');
    expect(formatIp(wildcardMask(30))).toBe('0.0.0.3');
  });
});

describe('network and broadcast', () => {
  it('works on a textbook /26', () => {
    const host = parseIp('192.168.1.130');
    expect(formatIp(networkAddress(host, 26))).toBe('192.168.1.128');
    expect(formatIp(broadcastAddress(host, 26))).toBe('192.168.1.191');
    expect(formatIp(firstUsable(host, 26))).toBe('192.168.1.129');
    expect(formatIp(lastUsable(host, 26))).toBe('192.168.1.190');
    expect(usableHosts(26)).toBe(62);
  });

  it('works across an octet boundary', () => {
    const host = parseIp('10.30.200.17');
    expect(formatIp(networkAddress(host, 20))).toBe('10.30.192.0');
    expect(formatIp(broadcastAddress(host, 20))).toBe('10.30.207.255');
    expect(usableHosts(20)).toBe(4094);
  });

  it('treats a /32 as a single address', () => {
    const host = parseIp('203.0.113.9');
    expect(formatIp(networkAddress(host, 32))).toBe('203.0.113.9');
    expect(formatIp(broadcastAddress(host, 32))).toBe('203.0.113.9');
  });

  it('reports both conventions for /31 and /32', () => {
    // The exam says 2^h - 2; RFC 3021 says a /31 carries a point-to-point pair.
    expect(usableHosts(31)).toBe(0);
    expect(usableHosts(32)).toBe(0);
    expect(usableHostsRfc3021(31)).toBe(2);
    expect(usableHostsRfc3021(32)).toBe(1);
  });

  it('counts total addresses', () => {
    expect(totalAddresses(24)).toBe(256);
    expect(totalAddresses(30)).toBe(4);
    expect(totalAddresses(0)).toBe(4294967296);
  });
});

describe('classification', () => {
  it('assigns classful ranges by first octet', () => {
    expect(addressClass(parseIp('10.0.0.1'))).toBe('A');
    expect(addressClass(parseIp('127.0.0.1'))).toBe('A');
    expect(addressClass(parseIp('128.0.0.1'))).toBe('B');
    expect(addressClass(parseIp('191.255.255.255'))).toBe('B');
    expect(addressClass(parseIp('192.0.0.1'))).toBe('C');
    expect(addressClass(parseIp('223.255.255.255'))).toBe('C');
    expect(addressClass(parseIp('224.0.0.1'))).toBe('D');
    expect(addressClass(parseIp('240.0.0.1'))).toBe('E');
  });

  it('identifies reserved ranges', () => {
    expect(classifyAddress(parseIp('10.1.2.3'))?.name).toMatch(/Private/);
    expect(classifyAddress(parseIp('172.16.0.1'))?.name).toMatch(/Private/);
    expect(classifyAddress(parseIp('172.31.255.255'))?.name).toMatch(/Private/);
    expect(classifyAddress(parseIp('192.168.99.1'))?.name).toMatch(/Private/);
    expect(classifyAddress(parseIp('169.254.1.1'))?.name).toMatch(/APIPA/);
    expect(classifyAddress(parseIp('127.0.0.1'))?.name).toMatch(/Loopback/);
    expect(classifyAddress(parseIp('100.64.0.1'))?.name).toMatch(/Carrier/);
    expect(classifyAddress(parseIp('224.0.0.251'))?.name).toMatch(/Multicast/);
  });

  it('does not over-claim the 172 range', () => {
    // 172.16.0.0/12 stops at 172.31.255.255 — this is the classic trap.
    expect(classifyAddress(parseIp('172.15.255.255'))).toBeUndefined();
    expect(classifyAddress(parseIp('172.32.0.0'))).toBeUndefined();
  });

  it('treats ordinary public space as unreserved', () => {
    expect(classifyAddress(parseIp('8.8.8.8'))).toBeUndefined();
    expect(classifyAddress(parseIp('203.0.113.10'))).toBeUndefined();
  });
});

describe('subnetting', () => {
  it('subdivides a /24 into four /26s', () => {
    const subnets = subdivide({ address: parseIp('192.168.1.0'), prefix: 24 }, 26);
    expect(subnets.map((s) => formatIp(s.address))).toEqual([
      '192.168.1.0',
      '192.168.1.64',
      '192.168.1.128',
      '192.168.1.192',
    ]);
  });

  it('picks the smallest prefix that fits a host count', () => {
    expect(prefixForHosts(2)).toBe(30);
    expect(prefixForHosts(6)).toBe(29);
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
    expect(prefixForHosts(254)).toBe(24);
    expect(prefixForHosts(255)).toBe(23);
  });

  it('picks the prefix for a subnet count', () => {
    expect(prefixForSubnets(24, 2)).toBe(25);
    expect(prefixForSubnets(24, 4)).toBe(26);
    expect(prefixForSubnets(24, 5)).toBe(27); // rounds up to the next power of two
    expect(prefixForSubnets(16, 8)).toBe(19);
  });

  it('refuses an impossible split', () => {
    expect(() => prefixForSubnets(30, 16)).toThrow();
    expect(() => subdivide({ address: 0, prefix: 26 }, 24)).toThrow(/larger than/);
  });
});
