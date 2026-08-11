import type { Rng } from '@engine/rng';
import type { Difficulty, Question } from '@engine/types';
import {
  addressClass,
  broadcastAddress,
  classifyAddress,
  defaultClassfulPrefix,
  firstUsable,
  formatIp,
  lastUsable,
  maskFromPrefix,
  networkAddress,
  parseIp,
  prefixForHosts,
  prefixForSubnets,
  totalAddresses,
  usableHosts,
  wildcardMask,
} from './ipv4';

/**
 * Procedurally generated subnetting practice.
 *
 * Subnetting is roughly a fifth of what people fail Network+ on, and it is the
 * one topic where an infinite supply of questions beats a finite bank — you need
 * reps until the arithmetic is automatic. Every answer here is computed from
 * `ipv4.ts`, so these questions are correct by construction and carry a
 * `generated` citation rather than a book page.
 */

type Generator = (rng: Rng, id: string) => Question;

const OBJECTIVE = '1.7';
const DOMAIN = '1.0';

function base(id: string, difficulty: Difficulty, generator: string) {
  return {
    id,
    track: 'n10-009' as const,
    domain: DOMAIN,
    objective: OBJECTIVE,
    difficulty,
    status: 'verified' as const,
    source: { kind: 'generated' as const, generator },
    tags: ['subnetting', 'generated'] as const,
  };
}

/** Random host address inside a routable-looking private range. */
function randomHost(rng: Rng, prefix: number): number {
  const bases = ['10.0.0.0', '172.16.0.0', '192.168.0.0'];
  const chosen = parseIp(rng.pick(bases));
  const hostBits = 32 - prefix;
  // Offset far enough into the block that the answer is rarely the base address.
  const offset = rng.int(1, Math.min(0x00ffffff, 2 ** Math.min(hostBits + 6, 24) - 1));
  return (chosen + offset) >>> 0;
}

/**
 * Builds a choice list from a correct answer plus candidate distractors, drops
 * duplicates and pads if a distractor happened to collide with the answer.
 */
function choicesFrom(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
  fallback: () => string,
): { choices: string[]; answer: number } {
  const seen = new Set([correct]);
  const picked: string[] = [];
  for (const d of distractors) {
    if (picked.length >= 3) break;
    if (seen.has(d)) continue;
    seen.add(d);
    picked.push(d);
  }
  let guard = 0;
  while (picked.length < 3 && guard++ < 50) {
    const candidate = fallback();
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    picked.push(candidate);
  }
  const all = rng.shuffle([correct, ...picked]);
  return { choices: all, answer: all.indexOf(correct) };
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const networkAddressQ: Generator = (rng, id) => {
  const prefix = rng.int(9, 30);
  const host = randomHost(rng, prefix);
  const answer = formatIp(networkAddress(host, prefix));

  return {
    ...base(id, prefix % 8 === 0 ? 1 : 2, 'subnet:network-address'),
    kind: 'input',
    prompt: `A host is configured with ${formatIp(host)}/${prefix}.\n\nWhat is the network address of its subnet?`,
    placeholder: 'x.x.x.x',
    accept: [answer, `${answer}/${prefix}`],
    explain:
      `The mask for /${prefix} is ${formatIp(maskFromPrefix(prefix))}. ` +
      `AND the address with the mask and every host bit clears to zero, giving ${answer}. ` +
      `The block size in the interesting octet is ${blockSize(prefix)}, so subnets start at multiples of ${blockSize(prefix)} there.`,
  };
};

const broadcastAddressQ: Generator = (rng, id) => {
  const prefix = rng.int(9, 30);
  const host = randomHost(rng, prefix);
  const answer = formatIp(broadcastAddress(host, prefix));

  return {
    ...base(id, 2, 'subnet:broadcast-address'),
    kind: 'input',
    prompt: `A host is configured with ${formatIp(host)}/${prefix}.\n\nWhat is the broadcast address of its subnet?`,
    placeholder: 'x.x.x.x',
    accept: [answer],
    explain:
      `Set every host bit to one. The subnet is ${formatIp(networkAddress(host, prefix))}/${prefix}, ` +
      `it holds ${totalAddresses(prefix).toLocaleString()} addresses, and the last of them is ${answer}. ` +
      `Equivalently: network address OR the wildcard mask ${formatIp(wildcardMask(prefix))}.`,
  };
};

const usableHostsQ: Generator = (rng, id) => {
  // Kept at /30 and shorter: /31 and /32 have two defensible answers.
  const prefix = rng.int(16, 30);
  const answer = usableHosts(prefix);
  const { choices, answer: answerIndex } = choicesFrom(
    rng,
    answer.toLocaleString(),
    [
      totalAddresses(prefix).toLocaleString(),
      (answer + 1).toLocaleString(),
      usableHosts(prefix - 1).toLocaleString(),
      usableHosts(prefix + 1 > 30 ? 30 : prefix + 1).toLocaleString(),
    ],
    () => rng.int(2, 65534).toLocaleString(),
  );

  return {
    ...base(id, 1, 'subnet:usable-hosts'),
    kind: 'choice',
    prompt: `How many usable host addresses does a /${prefix} subnet provide?`,
    choices,
    answer: answerIndex,
    explain:
      `A /${prefix} leaves ${32 - prefix} host bits, so 2^${32 - prefix} = ${totalAddresses(prefix).toLocaleString()} total addresses. ` +
      `Subtract the network address and the broadcast address: ${answer.toLocaleString()} usable.`,
  };
};

const maskTranslationQ: Generator = (rng, id) => {
  const prefix = rng.int(8, 30);
  const toDotted = rng.next() < 0.5;
  const dotted = formatIp(maskFromPrefix(prefix));

  if (toDotted) {
    const { choices, answer } = choicesFrom(
      rng,
      dotted,
      [
        formatIp(maskFromPrefix(prefix - 1)),
        formatIp(maskFromPrefix(prefix + 1 > 32 ? 32 : prefix + 1)),
        formatIp(wildcardMask(prefix)),
      ],
      () => formatIp(maskFromPrefix(rng.int(8, 30))),
    );
    return {
      ...base(id, 1, 'subnet:mask-to-dotted'),
      kind: 'choice',
      prompt: `Which subnet mask is equivalent to /${prefix}?`,
      choices,
      answer,
      explain:
        `/${prefix} means the leading ${prefix} bits are network bits. Writing ${prefix} ones followed by ` +
        `${32 - prefix} zeros and grouping into octets gives ${dotted}.`,
    };
  }

  const { choices, answer } = choicesFrom(
    rng,
    `/${prefix}`,
    [`/${prefix - 1}`, `/${prefix + 1}`, `/${32 - prefix}`],
    () => `/${rng.int(8, 30)}`,
  );
  return {
    ...base(id, 1, 'subnet:dotted-to-mask'),
    kind: 'choice',
    prompt: `A device shows a subnet mask of ${dotted}.\n\nWhat is the equivalent CIDR prefix?`,
    choices,
    answer,
    explain: `${dotted} has ${prefix} contiguous one-bits, which is written /${prefix}.`,
  };
};

const hostRangeQ: Generator = (rng, id) => {
  const prefix = rng.int(20, 30);
  const host = randomHost(rng, prefix);
  const first = formatIp(firstUsable(host, prefix));
  const last = formatIp(lastUsable(host, prefix));
  const correct = `${first} – ${last}`;

  const { choices, answer } = choicesFrom(
    rng,
    correct,
    [
      `${formatIp(networkAddress(host, prefix))} – ${formatIp(broadcastAddress(host, prefix))}`,
      `${first} – ${formatIp(broadcastAddress(host, prefix))}`,
      `${formatIp(networkAddress(host, prefix))} – ${last}`,
    ],
    () => {
      const other = randomHost(rng, prefix);
      return `${formatIp(firstUsable(other, prefix))} – ${formatIp(lastUsable(other, prefix))}`;
    },
  );

  return {
    ...base(id, 2, 'subnet:host-range'),
    kind: 'choice',
    prompt: `Which range covers the usable host addresses on ${formatIp(host)}/${prefix}?`,
    choices,
    answer,
    explain:
      `The subnet is ${formatIp(networkAddress(host, prefix))}/${prefix} and its broadcast address is ` +
      `${formatIp(broadcastAddress(host, prefix))}. Usable hosts sit strictly between the two: ${correct}.`,
  };
};

const sameSubnetQ: Generator = (rng, id) => {
  const prefix = rng.int(24, 29);
  const hostA = randomHost(rng, prefix);
  const net = networkAddress(hostA, prefix);
  const size = totalAddresses(prefix);

  // One address inside the same subnet, three in neighbouring ones.
  const inside = (net + rng.int(1, Math.max(1, size - 2))) >>> 0;
  const outside = [1, 2, 3].map((n) => (net + n * size + rng.int(1, Math.max(1, size - 2))) >>> 0);

  const { choices, answer } = choicesFrom(
    rng,
    formatIp(inside),
    outside.map(formatIp),
    () => formatIp((net + rng.int(1, 8) * size + 1) >>> 0),
  );

  return {
    ...base(id, 3, 'subnet:same-subnet'),
    kind: 'choice',
    prompt:
      `A workstation is configured with ${formatIp(hostA)}/${prefix}.\n\n` +
      `Which of these addresses can it reach without going through its default gateway?`,
    choices,
    answer,
    explain:
      `Its subnet is ${formatIp(net)}/${prefix}, which runs from ${formatIp(net)} to ` +
      `${formatIp(broadcastAddress(net, prefix))}. Only ${formatIp(inside)} falls inside that range, ` +
      `so only that one is reached by ARP on the local segment. Everything else is forwarded to the gateway.`,
  };
};

const subnetCountQ: Generator = (rng, id) => {
  const parent = rng.int(16, 26);
  const child = rng.int(parent + 1, Math.min(30, parent + 6));
  const count = 2 ** (child - parent);

  const { choices, answer } = choicesFrom(
    rng,
    count.toLocaleString(),
    [(count * 2).toLocaleString(), (count / 2).toLocaleString(), (child - parent).toLocaleString()],
    () => (2 ** rng.int(1, 8)).toLocaleString(),
  );

  return {
    ...base(id, 2, 'subnet:subnet-count'),
    kind: 'choice',
    prompt: `How many /${child} subnets fit inside a single /${parent}?`,
    choices,
    answer,
    explain:
      `Going from /${parent} to /${child} borrows ${child - parent} bits, and each borrowed bit doubles ` +
      `the subnet count: 2^${child - parent} = ${count.toLocaleString()} subnets, each holding ` +
      `${usableHosts(child).toLocaleString()} usable hosts.`,
  };
};

const designQ: Generator = (rng, id) => {
  const needed = rng.pick([12, 25, 50, 100, 200, 400, 800]);
  const prefix = prefixForHosts(needed);
  const { choices, answer } = choicesFrom(
    rng,
    `/${prefix}`,
    [`/${prefix + 1}`, `/${prefix - 1}`, `/${prefix + 2}`],
    () => `/${rng.int(20, 30)}`,
  );

  return {
    ...base(id, 3, 'subnet:design-for-hosts'),
    kind: 'choice',
    prompt:
      `A branch office needs to address ${needed} hosts on one VLAN, with as little waste as possible.\n\n` +
      `Which prefix length is the smallest that still fits?`,
    choices,
    answer,
    explain:
      `/${prefix} gives ${usableHosts(prefix).toLocaleString()} usable addresses, which covers ${needed}. ` +
      `The next size down, /${prefix + 1}, gives only ${usableHosts(prefix + 1).toLocaleString()} — not enough. ` +
      `Remember the network and broadcast addresses come off the top before you compare.`,
  };
};

const classifyQ: Generator = (rng, id) => {
  const samples: readonly string[] = [
    '10.14.9.200',
    '172.20.4.1',
    '192.168.50.7',
    '169.254.13.88',
    '127.0.0.1',
    '100.83.2.9',
    '224.0.0.251',
    '8.8.8.8',
    '203.0.113.10',
    '172.32.5.1',
  ];
  const text = rng.pick(samples);
  const address = parseIp(text);
  const special = classifyAddress(address);
  const label = special ? special.name : 'Public / globally routable';

  const allLabels = [
    'Private (RFC 1918)',
    'APIPA / link-local',
    'Loopback',
    'Carrier-grade NAT',
    'Multicast',
    'Public / globally routable',
  ];
  const { choices, answer } = choicesFrom(
    rng,
    label,
    rng.shuffle(allLabels.filter((l) => l !== label)),
    () => rng.pick(allLabels),
  );

  const reference = special ? ` (${special.reference})` : '';
  return {
    ...base(id, 2, 'subnet:classify'),
    kind: 'choice',
    prompt: `How would you classify the address ${text}?`,
    choices,
    answer,
    explain: special
      ? `${text} falls inside ${special.cidr}, reserved as ${special.name}${reference}.`
      : `${text} is not inside any reserved range, so it is ordinary public address space. ` +
        `Watch 172.x: only 172.16.0.0 – 172.31.255.255 is private, so 172.32.x.x is public.`,
  };
};

const classfulQ: Generator = (rng, id) => {
  const text = rng.pick(['12.0.0.1', '65.20.4.9', '130.44.1.1', '191.2.3.4', '200.1.1.1', '223.9.8.7']);
  const address = parseIp(text);
  const cls = addressClass(address);
  const prefix = defaultClassfulPrefix(address)!;

  const { choices, answer } = choicesFrom(
    rng,
    `Class ${cls}, default mask ${formatIp(maskFromPrefix(prefix))}`,
    [
      `Class A, default mask 255.0.0.0`,
      `Class B, default mask 255.255.0.0`,
      `Class C, default mask 255.255.255.0`,
    ].filter((s) => !s.startsWith(`Class ${cls},`)),
    () => `Class D, no default mask`,
  );

  return {
    ...base(id, 1, 'subnet:classful'),
    kind: 'choice',
    prompt: `Under classful addressing, what class is ${text} and what is its default mask?`,
    choices,
    answer,
    explain:
      `The first octet is ${(address >>> 24) & 255}. Class A runs 1–126, B runs 128–191, C runs 192–223, ` +
      `D (multicast) 224–239, E 240–255. That makes ${text} class ${cls}, default /${prefix} ` +
      `(${formatIp(maskFromPrefix(prefix))}). 127 is skipped because it is reserved for loopback.`,
  };
};

const vlsmQ: Generator = (rng, id) => {
  const parentPrefix = rng.int(22, 24);
  const parentNet = networkAddress(randomHost(rng, parentPrefix), parentPrefix);
  const subnetCount = rng.pick([2, 4, 8]);
  const childPrefix = prefixForSubnets(parentPrefix, subnetCount);
  const step = totalAddresses(childPrefix);
  const wanted = rng.int(2, subnetCount);
  const answerAddress = (parentNet + (wanted - 1) * step) >>> 0;
  const correct = `${formatIp(answerAddress)}/${childPrefix}`;

  const { choices, answer } = choicesFrom(
    rng,
    correct,
    [
      `${formatIp((parentNet + wanted * step) >>> 0)}/${childPrefix}`,
      `${formatIp((parentNet + (wanted - 1) * step) >>> 0)}/${childPrefix - 1}`,
      `${formatIp((parentNet + (wanted - 1) * (step / 2)) >>> 0)}/${childPrefix}`,
    ],
    () => `${formatIp((parentNet + rng.int(1, 8) * step) >>> 0)}/${childPrefix}`,
  );

  return {
    ...base(id, 3, 'subnet:vlsm'),
    kind: 'choice',
    prompt:
      `${formatIp(parentNet)}/${parentPrefix} is divided into ${subnetCount} equal subnets.\n\n` +
      `What is subnet number ${wanted}, counting the first subnet as number 1?`,
    choices,
    answer,
    explain:
      `${subnetCount} subnets needs ${childPrefix - parentPrefix} borrowed bits, taking /${parentPrefix} to ` +
      `/${childPrefix}. Each subnet spans ${step} addresses, so they start at ${formatIp(parentNet)}, ` +
      `${formatIp((parentNet + step) >>> 0)}, ${formatIp((parentNet + 2 * step) >>> 0)}… ` +
      `Subnet ${wanted} therefore begins at ${formatIp(answerAddress)}.`,
  };
};

const GENERATORS: readonly Generator[] = [
  networkAddressQ,
  broadcastAddressQ,
  usableHostsQ,
  maskTranslationQ,
  hostRangeQ,
  sameSubnetQ,
  subnetCountQ,
  designQ,
  classifyQ,
  classfulQ,
  vlsmQ,
];

/** Block size in the "interesting" octet, the mental shortcut most people use. */
function blockSize(prefix: number): number {
  const bitsIntoOctet = prefix % 8;
  return bitsIntoOctet === 0 ? 256 : 2 ** (8 - bitsIntoOctet);
}

/** Generate `count` subnetting questions. Ids embed the seed so runs replay. */
export function generateSubnetQuestions(rng: Rng, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    const generator = GENERATORS[i % GENERATORS.length]!;
    // Rotate through the generators so a run always covers the whole topic.
    const shuffled = i < GENERATORS.length ? generator : rng.pick(GENERATORS);
    return shuffled(rng, `n10-009.1.7.gen.${rng.seed}.${i}`);
  });
}

export const SUBNET_GENERATOR_COUNT = GENERATORS.length;
