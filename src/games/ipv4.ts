/**
 * IPv4 arithmetic.
 *
 * Everything the subnetting game asks is computed here rather than written down
 * by hand, so those questions cannot drift out of agreement with reality. The
 * unit tests pin the edge cases that trip people up.
 *
 * Note on /31 and /32: CompTIA teaches usable hosts = 2^h - 2, which gives 0 for
 * a /31. RFC 3021 permits a /31 to carry two hosts on a point-to-point link, and
 * a /32 addresses exactly one interface. Both readings are represented below —
 * `usableHosts` follows the exam, `usableHostsRfc3021` follows the RFC — and the
 * generator never asks a host-count question about a /31 or /32, because the
 * "right" answer depends on which convention the asker had in mind.
 */

export interface Ipv4Network {
  readonly address: number;
  readonly prefix: number;
}

const OCTET = /^(0|[1-9]\d{0,2})$/;

export function parseIp(text: string): number {
  const parts = text.trim().split('.');
  if (parts.length !== 4) throw new Error(`"${text}" is not a dotted-quad address`);
  let value = 0;
  for (const part of parts) {
    if (!OCTET.test(part)) throw new Error(`"${text}" has a malformed octet "${part}"`);
    const n = Number(part);
    if (n > 255) throw new Error(`"${text}" has an octet above 255`);
    value = (value * 256 + n) >>> 0;
  }
  return value >>> 0;
}

export function formatIp(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

export function maskFromPrefix(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error(`prefix /${prefix} is out of range`);
  // A 32-bit shift is undefined in JS, so /0 is special-cased.
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function prefixFromMask(mask: number): number {
  const m = mask >>> 0;
  let prefix = 0;
  let seenZero = false;
  for (let bit = 31; bit >= 0; bit--) {
    const set = ((m >>> bit) & 1) === 1;
    if (set) {
      if (seenZero) throw new Error(`${formatIp(m)} is not a contiguous subnet mask`);
      prefix++;
    } else {
      seenZero = true;
    }
  }
  return prefix;
}

export function networkAddress(address: number, prefix: number): number {
  return (address & maskFromPrefix(prefix)) >>> 0;
}

export function broadcastAddress(address: number, prefix: number): number {
  return (networkAddress(address, prefix) | (~maskFromPrefix(prefix) >>> 0)) >>> 0;
}

export function wildcardMask(prefix: number): number {
  return (~maskFromPrefix(prefix)) >>> 0;
}

export function totalAddresses(prefix: number): number {
  return 2 ** (32 - prefix);
}

/** The exam convention: 2^h - 2, floored at zero. */
export function usableHosts(prefix: number): number {
  return Math.max(0, totalAddresses(prefix) - 2);
}

/** RFC 3021 / single-host convention, for reference and for the explanations. */
export function usableHostsRfc3021(prefix: number): number {
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return usableHosts(prefix);
}

export function firstUsable(address: number, prefix: number): number {
  if (prefix >= 31) return networkAddress(address, prefix);
  return (networkAddress(address, prefix) + 1) >>> 0;
}

export function lastUsable(address: number, prefix: number): number {
  if (prefix >= 31) return broadcastAddress(address, prefix);
  return (broadcastAddress(address, prefix) - 1) >>> 0;
}

export function contains(network: Ipv4Network, address: number): boolean {
  return networkAddress(address, network.prefix) === networkAddress(network.address, network.prefix);
}

export function formatCidr(network: Ipv4Network): string {
  return `${formatIp(networkAddress(network.address, network.prefix))}/${network.prefix}`;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export type AddressClass = 'A' | 'B' | 'C' | 'D' | 'E';

/**
 * Classful ranges. Classful routing is obsolete but the exam still asks, and
 * "class" still shows up in conversation about default masks.
 */
export function addressClass(address: number): AddressClass {
  const first = (address >>> 24) & 255;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D';
  return 'E';
}

/** Default classful mask. Undefined for D (multicast) and E (experimental). */
export function defaultClassfulPrefix(address: number): number | undefined {
  switch (addressClass(address)) {
    case 'A':
      return 8;
    case 'B':
      return 16;
    case 'C':
      return 24;
    default:
      return undefined;
  }
}

export interface SpecialRange {
  readonly cidr: string;
  readonly name: string;
  readonly reference: string;
}

/** Ranges the exam expects you to recognise on sight. */
export const SPECIAL_RANGES: readonly SpecialRange[] = [
  { cidr: '10.0.0.0/8', name: 'Private (RFC 1918)', reference: 'RFC 1918 §3' },
  { cidr: '172.16.0.0/12', name: 'Private (RFC 1918)', reference: 'RFC 1918 §3' },
  { cidr: '192.168.0.0/16', name: 'Private (RFC 1918)', reference: 'RFC 1918 §3' },
  { cidr: '127.0.0.0/8', name: 'Loopback', reference: 'RFC 1122 §3.2.1.3' },
  { cidr: '169.254.0.0/16', name: 'APIPA / link-local', reference: 'RFC 3927 §2.1' },
  { cidr: '100.64.0.0/10', name: 'Carrier-grade NAT', reference: 'RFC 6598 §7' },
  { cidr: '224.0.0.0/4', name: 'Multicast', reference: 'RFC 5771 §1' },
  { cidr: '240.0.0.0/4', name: 'Reserved / experimental', reference: 'RFC 1112 §4' },
  { cidr: '0.0.0.0/8', name: 'This network', reference: 'RFC 1122 §3.2.1.3' },
];

export function classifyAddress(address: number): SpecialRange | undefined {
  for (const range of SPECIAL_RANGES) {
    const [ip = '', prefixText = '0'] = range.cidr.split('/');
    const network = { address: parseIp(ip), prefix: Number(prefixText) };
    if (contains(network, address)) return range;
  }
  return undefined;
}

export function isPrivate(address: number): boolean {
  const found = classifyAddress(address);
  return found?.name.startsWith('Private') ?? false;
}

// ---------------------------------------------------------------------------
// Subnetting
// ---------------------------------------------------------------------------

/** Split a network into equal-sized subnets at `newPrefix`. */
export function subdivide(network: Ipv4Network, newPrefix: number): Ipv4Network[] {
  if (newPrefix < network.prefix) {
    throw new Error(`/${newPrefix} is larger than the parent /${network.prefix}`);
  }
  const count = 2 ** (newPrefix - network.prefix);
  if (count > 4096) throw new Error(`refusing to enumerate ${count} subnets`);
  const base = networkAddress(network.address, network.prefix);
  const step = totalAddresses(newPrefix);
  return Array.from({ length: count }, (_, i) => ({
    address: (base + i * step) >>> 0,
    prefix: newPrefix,
  }));
}

/** Smallest prefix that still fits `hosts` usable addresses, exam convention. */
export function prefixForHosts(hosts: number): number {
  if (hosts < 1) throw new Error('need at least one host');
  for (let prefix = 30; prefix >= 0; prefix--) {
    if (usableHosts(prefix) >= hosts) return prefix;
  }
  throw new Error(`no prefix fits ${hosts} hosts`);
}

/** Smallest prefix that provides at least `count` equal subnets. */
export function prefixForSubnets(parentPrefix: number, count: number): number {
  const bits = Math.ceil(Math.log2(count));
  const prefix = parentPrefix + bits;
  if (prefix > 32) throw new Error(`cannot carve ${count} subnets out of a /${parentPrefix}`);
  return prefix;
}
