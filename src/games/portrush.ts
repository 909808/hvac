import type { Rng } from '@engine/rng';
import type { Question } from '@engine/types';
import { PORTS, formatPorts, type PortEntry } from '@content/network-plus/ports';

/**
 * Port Rush: rapid-fire recall drawn from the IANA-cited table in
 * `src/content/network-plus/ports.ts`.
 *
 * Like the subnetting generator, the answers are derived from data rather than
 * written out per question, so adding a row to the table adds questions to the
 * game and there is exactly one place a port number can be wrong.
 */

const OBJECTIVE = '1.4';
const DOMAIN = '1.0';

function base(id: string, generator: string) {
  return {
    id,
    track: 'n10-009' as const,
    domain: DOMAIN,
    objective: OBJECTIVE,
    status: 'verified' as const,
    source: { kind: 'generated' as const, generator },
    tags: ['ports', 'generated'] as const,
  };
}

/** Distractor ports: real ports from the table, never invented numbers. */
function otherPorts(rng: Rng, exclude: PortEntry, n: number): number[] {
  const pool = PORTS.filter((p) => p.protocol !== exclude.protocol).flatMap((p) => [...p.ports]);
  const excluded = new Set(exclude.ports);
  const unique = [...new Set(pool)].filter((p) => !excluded.has(p));
  return rng.sample(unique, n);
}

const portForProtocol = (rng: Rng, id: string): Question => {
  const entry = rng.pick(PORTS);
  const correct = formatPorts(entry);
  const distractors = otherPorts(rng, entry, 3).map(String);
  const choices = rng.shuffle([correct, ...distractors]);

  return {
    ...base(id, 'ports:protocol-to-port'),
    kind: 'choice',
    difficulty: 1,
    prompt: `Which port does ${entry.protocol} use?`,
    choices,
    answer: choices.indexOf(correct),
    explain: `${entry.protocol} runs on ${correct}/${entry.transport}. ${entry.purpose}. (${entry.reference})`,
  };
};

const protocolForPort = (rng: Rng, id: string): Question => {
  const entry = rng.pick(PORTS);
  const port = rng.pick(entry.ports);

  // Only offer protocols that do not also claim this port, so there is one answer.
  const others = PORTS.filter((p) => p.protocol !== entry.protocol && !p.ports.includes(port));
  const choices = rng.shuffle([entry.protocol, ...rng.sample(others, 3).map((p) => p.protocol)]);

  return {
    ...base(id, 'ports:port-to-protocol'),
    kind: 'choice',
    difficulty: 1,
    prompt: `A firewall log shows traffic to port ${port}/${entry.transport === 'TCP/UDP' ? 'TCP' : entry.transport}.\n\nWhich protocol is that?`,
    choices,
    answer: choices.indexOf(entry.protocol),
    explain: `Port ${port} is ${entry.protocol}. ${entry.purpose}. (${entry.reference})`,
  };
};

const transportForProtocol = (rng: Rng, id: string): Question => {
  const entry = rng.pick(PORTS);
  const choices = ['TCP', 'UDP', 'TCP/UDP'];

  return {
    ...base(id, 'ports:transport'),
    kind: 'choice',
    difficulty: 2,
    prompt: `Which transport protocol does ${entry.protocol} use?`,
    choices,
    answer: choices.indexOf(entry.transport),
    explain:
      entry.transport === 'TCP/UDP'
        ? `${entry.protocol} uses both. ${entry.purpose}. (${entry.reference})`
        : `${entry.protocol} uses ${entry.transport}. ${entry.purpose}. (${entry.reference})`,
  };
};

const secureSwapQ = (rng: Rng, id: string): Question => {
  const insecure = PORTS.filter((p) => p.insecure && p.secureAlternative);
  const entry = rng.pick(insecure);
  const correct = entry.secureAlternative!;
  const wrong = insecure
    .filter((p) => p.secureAlternative !== correct)
    .map((p) => p.secureAlternative!);

  const choices = rng.shuffle([correct, ...rng.sample([...new Set(wrong)], 3)]);

  return {
    ...base(id, 'ports:secure-alternative'),
    kind: 'choice',
    difficulty: 2,
    prompt:
      `An audit flags ${entry.protocol} on port ${formatPorts(entry)} as sending credentials in cleartext.\n\n` +
      `What should replace it?`,
    choices,
    answer: choices.indexOf(correct),
    explain:
      `${entry.protocol} has no transport encryption, so anyone on the path can read the session. ` +
      `${correct} carries the same function inside TLS or SSH. (${entry.reference})`,
  };
};

const matchQ = (rng: Rng, id: string): Question => {
  // Several protocols share a port — SSH and SFTP are both 22/TCP — so sample
  // by the right-hand label rather than by protocol, otherwise the pairing has
  // no single correct answer.
  const byLabel = new Map<string, PortEntry>();
  for (const entry of PORTS) {
    const label = `${formatPorts(entry)}/${entry.transport}`;
    if (!byLabel.has(label)) byLabel.set(label, entry);
  }
  const entries = rng.sample([...byLabel.values()], 5);

  return {
    ...base(id, 'ports:match'),
    kind: 'match',
    difficulty: 2,
    prompt: 'Match each protocol to its port.',
    pairs: entries.map((e) => [e.protocol, `${formatPorts(e)}/${e.transport}`] as const),
    explain: entries.map((e) => `${e.protocol} → ${formatPorts(e)}/${e.transport}`).join('\n'),
  };
};

const typedPortQ = (rng: Rng, id: string): Question => {
  // Single-port protocols only, so there is one unambiguous number to type.
  const entry = rng.pick(PORTS.filter((p) => p.ports.length === 1));
  const port = String(entry.ports[0]);

  return {
    ...base(id, 'ports:typed'),
    kind: 'input',
    difficulty: 2,
    prompt: `Type the port number used by ${entry.protocol}.`,
    placeholder: 'e.g. 443',
    accept: [port],
    explain: `${entry.protocol} uses ${port}/${entry.transport}. ${entry.purpose}. (${entry.reference})`,
  };
};

const GENERATORS = [
  portForProtocol,
  protocolForPort,
  transportForProtocol,
  secureSwapQ,
  matchQ,
  typedPortQ,
] as const;

export function generatePortQuestions(rng: Rng, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    const generator = i < GENERATORS.length ? GENERATORS[i]! : rng.pick(GENERATORS);
    return generator(rng, `n10-009.1.4.gen.${rng.seed}.${i}`);
  });
}
