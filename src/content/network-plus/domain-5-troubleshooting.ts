import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/**
 * Domain 5.0 — Network Troubleshooting (24% of the exam, the largest single domain).
 *
 * These are the questions worth the most study time, and the ones where a
 * diagram earns its place — most of the difficulty is in reading a symptom
 * against a topology rather than in recalling a fact.
 */

const T = { track: 'n10-009', domain: '5.0' } as const;

// --- Shared topologies ------------------------------------------------------

const branchTopology: Topology = {
  caption: 'Branch office — PC-A cannot reach the internet',
  nodes: [
    { id: 'net', kind: 'cloud', label: 'Internet', col: 0, row: 1 },
    { id: 'fw', kind: 'firewall', label: 'FW-1', sublabel: '203.0.113.2', col: 1, row: 1 },
    { id: 'rtr', kind: 'router', label: 'RTR-1', sublabel: '10.10.10.1', col: 2, row: 1 },
    { id: 'sw1', kind: 'switch', label: 'SW-1', sublabel: 'VLAN 10', col: 3, row: 0 },
    { id: 'sw2', kind: 'switch', label: 'SW-2', sublabel: 'VLAN 10', col: 3, row: 2 },
    { id: 'pca', kind: 'pc', label: 'PC-A', sublabel: '10.10.10.55', col: 4, row: 0, state: 'warn' },
    { id: 'pcb', kind: 'pc', label: 'PC-B', sublabel: '10.10.10.56', col: 4, row: 2 },
  ],
  links: [
    { from: 'net', to: 'fw' },
    { from: 'fw', to: 'rtr' },
    { from: 'rtr', to: 'sw1' },
    { from: 'rtr', to: 'sw2' },
    { from: 'sw1', to: 'pca', state: 'warn' },
    { from: 'sw2', to: 'pcb' },
  ],
};

const serverTopology: Topology = {
  caption: 'Users report the intranet site is slow, but only from the second floor',
  nodes: [
    { id: 'srv', kind: 'server', label: 'WEB-1', sublabel: '10.20.0.10', col: 0, row: 1 },
    { id: 'core', kind: 'switch', label: 'CORE', col: 1, row: 1 },
    { id: 'sw1', kind: 'switch', label: 'FL1-SW', sublabel: '1 Gb uplink', col: 2, row: 0 },
    { id: 'sw2', kind: 'switch', label: 'FL2-SW', sublabel: '100 Mb uplink', col: 2, row: 2, state: 'warn' },
    { id: 'pc1', kind: 'pc', label: 'Floor 1', col: 3, row: 0 },
    { id: 'pc2', kind: 'pc', label: 'Floor 2', col: 3, row: 2, state: 'warn' },
  ],
  links: [
    { from: 'srv', to: 'core' },
    { from: 'core', to: 'sw1', label: '1 Gb' },
    { from: 'core', to: 'sw2', label: '100 Mb', state: 'warn' },
    { from: 'sw1', to: 'pc1' },
    { from: 'sw2', to: 'pc2', state: 'warn' },
  ],
};

// --- 5.1 Methodology --------------------------------------------------------

const methodology = defineQuestion({
  ...T,
  id: 'n10-009.5.1.seven-steps',
  objective: '5.1',
  kind: 'order',
  difficulty: 2,
  prompt: 'Put the CompTIA troubleshooting methodology in order.',
  steps: [
    'Identify the problem',
    'Establish a theory of probable cause',
    'Test the theory to determine the cause',
    'Establish a plan of action and identify potential effects',
    'Implement the solution or escalate',
    'Verify full system functionality and implement preventive measures',
    'Document findings, actions, outcomes and lessons learned',
  ],
  explain:
    'The exam tests this order directly, and the two steps people drop are the last two. Verifying is what ' +
    'catches a fix that solved the symptom and broke something else; documenting is what stops the next person ' +
    'spending the same three hours. Note also that testing the theory comes before planning the fix — if the ' +
    'theory does not hold, you go back and form a new one rather than pressing on.',
  source: cite.standard('CompTIA N10-009 exam objectives, objective 5.1'),
  status: 'verified',
});

const identifyFirst = defineQuestion({
  ...T,
  id: 'n10-009.5.1.escalate-or-continue',
  objective: '5.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You have established a theory, tested it, and confirmed the cause is a failed line card in a core switch ' +
    'under vendor support. Replacing it is outside your authority.\n\nWhat does the methodology say to do next?',
  choices: [
    'Escalate, as part of establishing and carrying out the plan of action',
    'Go back and establish a new theory',
    'Document the findings and close the ticket',
    'Implement a workaround without recording it',
  ],
  answer: 0,
  explain:
    'Escalation is an explicit branch of step five — "implement the solution or escalate as necessary" — not an ' +
    'admission of failure. The cause is confirmed, so re-theorising would be wasted work. What you must not do ' +
    'is stop: the ticket stays yours until functionality is verified and the work is documented.',
  source: cite.standard('CompTIA N10-009 exam objectives, objective 5.1'),
  status: 'verified',
});

// --- 5.2 Cabling and physical -----------------------------------------------

const duplexMismatch = defineQuestion({
  ...T,
  id: 'n10-009.5.2.duplex-mismatch',
  objective: '5.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A link stays up, but throughput is poor and worsens under load. The switch port counters show late ' +
    'collisions on one side and FCS errors on the other.\n\nWhat is the most likely cause?',
  choices: [
    'A duplex mismatch — one side is full duplex, the other half',
    'A failed transceiver',
    'An exhausted DHCP scope',
    'A routing loop',
  ],
  answer: 0,
  whyWrong: {
    1: 'A failed transceiver usually takes the link down rather than degrading it under load.',
    2: 'DHCP has no effect on link-layer error counters.',
    3: 'A routing loop shows as TTL expiry and traceroute repetition, not late collisions.',
  },
  explain:
    'Late collisions are the tell. A normal collision is detected within the first 64 bytes; a late one means ' +
    'the other end transmitted while this end was already sending, which is what happens when a full-duplex ' +
    'side ignores carrier sense and a half-duplex side does not. Usually one end is hard-coded and the other ' +
    'is left on autonegotiation. Set both ends the same — either both auto, or both hard-coded.',
  source: cite.standard('IEEE 802.3 clause 4.2.3.2.4 (late collision definition)'),
  status: 'verified',
});

const cableTesting = defineQuestion({
  ...T,
  id: 'n10-009.5.2.tool-for-fault',
  objective: '5.2',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each physical-layer tool to the job it does.',
  pairs: [
    ['Cable tester', 'Confirms continuity and pinout end to end'],
    ['Time-domain reflectometer', 'Locates a break or short by distance along the cable'],
    ['Tone generator and probe', 'Finds which cable in a bundle is which'],
    ['Optical power meter', 'Measures how much light is arriving on a fibre'],
    ['Punchdown tool', 'Seats conductors into an IDC on a patch panel or keystone'],
  ],
  explain:
    'The distinction worth holding is tester versus TDR: a tester tells you the cable is bad, a TDR tells you ' +
    'it is bad 43 metres from where you are standing. On fibre, an optical power meter answers the question ' +
    'a copper tester cannot — the link may be continuous but arriving too dim.',
  source: cite.todo('Confirm the tool list against the troubleshooting tools chapter of your study guide.'),
  status: 'draft',
});

const attenuation = defineQuestion({
  ...T,
  id: 'n10-009.5.2.long-run',
  objective: '5.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A newly installed camera 140 metres from the switch links intermittently at 100 Mbps and drops under load. ' +
    'The cable is Cat 6 and terminates correctly.\n\nWhat is the cause?',
  choices: [
    'The run exceeds the 100 m maximum, so signal attenuation is causing errors',
    'Cat 6 cannot support 100 Mbps',
    'The camera needs a crossover cable',
    'The switch port is in the wrong VLAN',
  ],
  answer: 0,
  explain:
    'Copper Ethernet is specified to 100 m for the whole channel, and 140 m is well past it. Attenuation and ' +
    'noise rise with distance until the receiver can no longer recover the signal reliably — which shows up as ' +
    'exactly this pattern of a link that trains but fails under load. The fixes are a fibre run, or an ' +
    'intermediate switch or media converter to break the distance into compliant segments.',
  source: cite.standard('ANSI/TIA-568 series; IEEE 802.3 clause 40'),
  status: 'verified',
});

// --- 5.3 Network services ---------------------------------------------------

const gatewayMissing = defineQuestion({
  ...T,
  id: 'n10-009.5.3.default-gateway',
  objective: '5.3',
  kind: 'choice',
  difficulty: 2,
  topology: branchTopology,
  prompt:
    'PC-A can ping PC-B and can ping its own address, but cannot reach anything beyond the local subnet — ' +
    'including by IP address, so name resolution is not involved.\n\nWhat should you check first?',
  choices: [
    "PC-A's default gateway setting",
    "PC-A's DNS server setting",
    'The firewall rulebase',
    'The internet circuit',
  ],
  whyWrong: {
    1: 'DNS is ruled out — the failure happens when connecting by IP address.',
    2: 'A firewall problem would affect PC-B as well.',
    3: 'The circuit being down would affect PC-B as well.',
  },
  answer: 0,
  explain:
    'Local traffic works, so the NIC, cable, switch port and VLAN are all fine. What separates local from ' +
    'remote traffic is the default gateway: without it the host has no route off its own subnet. That PC-B is ' +
    'unaffected points at a per-host setting rather than anything shared, which is the reasoning that gets you ' +
    'there faster than testing devices one by one.',
  source: cite.standard('RFC 1122 §3.3.1 (routing outbound datagrams)'),
  status: 'verified',
});

const dnsFailure = defineQuestion({
  ...T,
  id: 'n10-009.5.3.dns-symptom',
  objective: '5.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A user reports "the internet is down". You find that ping to 8.8.8.8 succeeds but ping to google.com ' +
    'fails with an unresolved-host error.\n\nWhat does this isolate the fault to?',
  choices: [
    'Name resolution — routing and connectivity are working',
    'The default gateway',
    'The physical link',
    'The DHCP server',
  ],
  answer: 0,
  explain:
    'Reaching an address but not a name splits the problem cleanly: everything up to layer 3 works, so the ' +
    'fault is in DNS. Check the configured resolver, whether it answers (`nslookup`/`dig` against it directly), ' +
    'and whether anything is blocking UDP 53. This ping-by-IP-then-by-name test takes ten seconds and is worth ' +
    'making a reflex.',
  source: cite.standard('RFC 1035'),
  status: 'verified',
});

const vlanMisassignment = defineQuestion({
  ...T,
  id: 'n10-009.5.3.wrong-vlan',
  objective: '5.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A workstation moved to a different desk now receives an address in 192.168.40.0/24 instead of the ' +
    'expected 10.10.10.0/24. The DHCP server has scopes for both. Nothing was changed on the workstation.\n\n' +
    'What is the most likely cause?',
  choices: [
    'The new switch port is assigned to a different VLAN',
    'The workstation has a static address configured',
    'The DHCP server has run out of leases',
    'The workstation has a failing NIC',
  ],
  answer: 0,
  explain:
    'The client broadcasts on whatever VLAN its port belongs to, and the relay stamps that subnet into the ' +
    'request, so the server answers from the matching scope. Getting a valid address from the wrong scope ' +
    'means the port is in the wrong VLAN — the DHCP infrastructure is working correctly and doing exactly what ' +
    'it was told. A static address would not change on moving desks, and an exhausted scope gives no address ' +
    'at all rather than the wrong one.',
  source: cite.standard('RFC 2131 §4.3.1'),
  status: 'verified',
});

// --- 5.4 Performance --------------------------------------------------------

const bottleneck = defineQuestion({
  ...T,
  id: 'n10-009.5.4.uplink-bottleneck',
  objective: '5.4',
  kind: 'choice',
  difficulty: 2,
  topology: serverTopology,
  prompt:
    'Second-floor users find the intranet slow. First-floor users, reaching the same server, do not. Both ' +
    'floors use identical workstations and the server load is low.\n\nWhere would you look first?',
  choices: [
    'The 100 Mb uplink between the core and the second-floor switch',
    'The web server CPU',
    'The workstation configuration on the second floor',
    'The internet circuit',
  ],
  answer: 0,
  explain:
    'What differs between the two groups is the path, not the endpoints or the server. The second-floor uplink ' +
    'runs at a tenth of the first floor\'s and is shared by everyone on that switch, so it saturates first. ' +
    'Comparing a working group against a failing one and asking what is different between them is usually ' +
    'faster than instrumenting either in isolation.',
  source: cite.todo('Confirm against the performance troubleshooting chapter of your study guide.'),
  status: 'draft',
});

const latencyJitter = defineQuestion({
  ...T,
  id: 'n10-009.5.4.jitter',
  objective: '5.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A video conference shows choppy audio while file transfers over the same link run at full speed. ' +
    'Ping to the far end averages 30 ms but ranges from 8 ms to 190 ms.\n\nWhat is the problem?',
  choices: [
    'Jitter — the variation in latency, not its average',
    'Insufficient bandwidth',
    'Packet corruption from a bad cable',
    'An MTU mismatch',
  ],
  answer: 0,
  explain:
    'Real-time media plays out at a fixed rate, so it cares about consistency more than about average delay. ' +
    'A jitter buffer absorbs some variation, but a spread from 8 ms to 190 ms overruns it and the audio breaks ' +
    'up. Bandwidth is clearly adequate given the file transfers, which is what rules out the obvious answer.',
  source: cite.standard('RFC 3550 §6.4.1 (interarrival jitter)'),
  status: 'verified',
});

// --- 5.5 Tools --------------------------------------------------------------

const toolChoice = defineQuestion({
  ...T,
  id: 'n10-009.5.5.command-tools',
  objective: '5.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each command to what it tells you.',
  pairs: [
    ['ping', 'Whether a host answers, and the round-trip time'],
    ['traceroute / tracert', 'The path taken and where delay or loss begins'],
    ['nslookup / dig', 'What a DNS server answers for a given name'],
    ['arp -a', 'The local mapping of IP addresses to MAC addresses'],
    ['netstat', 'Local connections, listening ports and their state'],
    ['ipconfig / ifconfig / ip', 'The interface addressing on this machine'],
  ],
  explain:
    'Choosing the tool is really choosing the layer. ping and traceroute test layer 3 reachability and path; ' +
    'arp is layer 2 on the local segment; nslookup tests a name service; netstat looks at layer 4 on the host ' +
    'itself. Naming the layer you doubt first tends to pick the tool for you.',
  source: cite.todo('Confirm the command list against the tools chapter of your study guide.'),
  status: 'draft',
});

const tracerouteReading = defineQuestion({
  ...T,
  id: 'n10-009.5.5.traceroute-stars',
  objective: '5.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A traceroute shows normal times for hops 1 to 4, asterisks for hops 5 and 6, then normal times again for ' +
    'hops 7 to 10, and the destination responds.\n\nWhat does this most likely mean?',
  choices: [
    'Hops 5 and 6 are configured not to reply to the probes, while forwarding traffic normally',
    'The path is broken at hop 5',
    'The destination host is down',
    'There is a routing loop between hops 5 and 6',
  ],
  answer: 0,
  explain:
    'Traffic clearly passes through hops 5 and 6 — hops 7 onward answered, and so did the destination. ' +
    'Asterisks mean those routers did not send an ICMP time-exceeded message, which many devices are ' +
    'deliberately configured not to do, or rate-limit. Non-responding middle hops are normal. What actually ' +
    'indicates a break is asterisks from a hop all the way to the end.',
  source: cite.standard('RFC 792 (ICMP time exceeded); RFC 1812 §4.3.2.8 (rate limiting)'),
  status: 'verified',
});

export const DOMAIN_5_QUESTIONS: readonly Question[] = [
  methodology,
  identifyFirst,
  duplexMismatch,
  cableTesting,
  attenuation,
  gatewayMissing,
  dnsFailure,
  vlanMisassignment,
  bottleneck,
  latencyJitter,
  toolChoice,
  tracerouteReading,
];
