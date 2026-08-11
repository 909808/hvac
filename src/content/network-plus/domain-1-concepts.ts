import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Domain 1.0 — Networking Concepts (23% of the exam).
 *
 * Starter content. Items citing an RFC or IEEE standard are `verified` — those
 * are facts you can check against the primary source in a minute. Items marked
 * `draft` with a `cite.todo` are the ones to replace first: read the relevant
 * pages in one of the registered books, correct anything that is off, then swap
 * the source for `cite.book(...)` and flip the status to `verified`.
 */

const T = { track: 'n10-009', domain: '1.0' } as const;

// --- 1.1 OSI model ---------------------------------------------------------

const osiOrder = defineQuestion({
  ...T,
  id: 'n10-009.1.1.osi-order',
  objective: '1.1',
  kind: 'order',
  difficulty: 1,
  prompt: 'Put the OSI layers in order, layer 1 at the top.',
  steps: [
    'Physical',
    'Data Link',
    'Network',
    'Transport',
    'Session',
    'Presentation',
    'Application',
  ],
  explain:
    'Bottom to top: Physical, Data Link, Network, Transport, Session, Presentation, Application. ' +
    'Data moves down the stack on the way out and up on the way in, gaining and shedding a header at each layer.',
  source: cite.standard('ISO/IEC 7498-1, OSI Basic Reference Model'),
  status: 'verified',
});

const osiPdu = defineQuestion({
  ...T,
  id: 'n10-009.1.1.pdu-names',
  objective: '1.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each OSI layer to the name of its protocol data unit.',
  pairs: [
    ['Layer 1 — Physical', 'Bits'],
    ['Layer 2 — Data Link', 'Frames'],
    ['Layer 3 — Network', 'Packets'],
    ['Layer 4 — Transport', 'Segments (TCP) or datagrams (UDP)'],
  ],
  explain:
    'The unit name tells you which header you are looking at. A frame carries MAC addresses, ' +
    'a packet carries IP addresses, a segment carries ports. Naming the unit correctly is often ' +
    'the fastest way to work out which device in the path is responsible for a fault.',
  source: cite.standard('ISO/IEC 7498-1 §5.6'),
  status: 'verified',
});

const layerForDevice = defineQuestion({
  ...T,
  id: 'n10-009.1.1.switch-layer',
  objective: '1.1',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'An unmanaged switch forwards traffic by looking up the destination address in its MAC address table.\n\n' +
    'At which OSI layer is it operating?',
  choices: ['Layer 1 — Physical', 'Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport'],
  answer: 1,
  whyWrong: {
    0: 'A hub or a repeater is layer 1 — it copies electrical signals without reading any address.',
    2: 'Layer 3 forwarding means reading IP addresses, which is what a router or an L3 switch does.',
    3: 'Layer 4 means making decisions on port numbers, as a firewall or load balancer does.',
  },
  explain:
    'MAC addresses live in the frame header, which is layer 2. A switch that also reads IP headers to route ' +
    'between VLANs is described as a layer 3 switch, but plain MAC-based forwarding is layer 2.',
  source: cite.standard('IEEE 802.1D, MAC Bridges'),
  status: 'verified',
});

// --- 1.2 Appliances and functions -----------------------------------------

const proxyVsReverse = defineQuestion({
  ...T,
  id: 'n10-009.1.2.reverse-proxy',
  objective: '1.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A company wants TLS terminated centrally, and wants inbound web requests spread across four identical ' +
    'application servers without exposing those servers directly.\n\nWhich appliance role fits?',
  choices: [
    'Reverse proxy',
    'Forward proxy',
    'NAT gateway',
    'Layer 2 switch',
  ],
  answer: 0,
  whyWrong: {
    1: 'A forward proxy sits in front of clients heading outbound, controlling and caching what users reach.',
    2: 'NAT rewrites addresses but does not terminate TLS or distribute load across a server pool.',
    3: 'A layer 2 switch has no visibility of TLS or HTTP.',
  },
  explain:
    'A reverse proxy sits in front of servers and accepts connections on their behalf: it terminates TLS, ' +
    'hides the real server addresses, and can balance across a pool. A forward proxy is the mirror image — ' +
    'it sits in front of clients. "Which side is it protecting" is the question that separates the two.',
  source: cite.todo('Confirm against the load balancer / proxy section of your study guide.'),
  status: 'draft',
});

// --- 1.4 Ports, protocols, traffic types ----------------------------------

const trafficTypes = defineQuestion({
  ...T,
  id: 'n10-009.1.4.traffic-types',
  objective: '1.4',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each traffic type to what it describes.',
  pairs: [
    ['Unicast', 'One sender to one specific recipient'],
    ['Broadcast', 'One sender to every host on the segment'],
    ['Multicast', 'One sender to a subscribed group of recipients'],
    ['Anycast', 'One sender to the nearest of several identical destinations'],
  ],
  explain:
    'Broadcast stops at the router — that boundary is what makes a broadcast domain. Multicast needs group ' +
    'membership (IGMP on IPv4) so switches do not flood it everywhere. Anycast is how public DNS resolvers ' +
    'answer from whichever site is closest, with the same address advertised from many places.',
  source: cite.standard('RFC 1112 (multicast), RFC 4786 (anycast)'),
  status: 'verified',
});

const dnsRecordTypes = defineQuestion({
  ...T,
  id: 'n10-009.1.4.dns-records',
  objective: '1.4',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each DNS record type to its purpose.',
  pairs: [
    ['A', 'Maps a hostname to an IPv4 address'],
    ['AAAA', 'Maps a hostname to an IPv6 address'],
    ['CNAME', 'Points a name at another name'],
    ['MX', 'Names the mail servers for a domain'],
    ['PTR', 'Maps an address back to a hostname'],
    ['TXT', 'Carries free-form text, used by SPF, DKIM and domain verification'],
  ],
  explain:
    'The pair that catches people out is A versus AAAA — "quad-A" is IPv6, and the name is a reminder that ' +
    'an IPv6 address is four times the size of an IPv4 one. PTR lives in the reverse zone and is what ' +
    'mail servers check when deciding whether you look legitimate.',
  source: cite.standard('RFC 1035 §3.3, RFC 3596 (AAAA)'),
  status: 'verified',
});

// --- 1.5 Media and transceivers -------------------------------------------

const copperDistance = defineQuestion({
  ...T,
  id: 'n10-009.1.5.copper-distance',
  objective: '1.5',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'What is the maximum specified length of a twisted-pair copper Ethernet run, from switch port to wall port to workstation?',
  choices: ['55 metres', '90 metres', '100 metres', '185 metres'],
  answer: 2,
  whyWrong: {
    0: '55 m is the reduced distance for 10GBASE-T over Cat 6 rather than Cat 6a.',
    1: '90 m is the permanent link — the in-wall portion. Patch cords make up the remaining 10 m.',
    3: '185 m is 10BASE2 thin coaxial, long obsolete.',
  },
  explain:
    'The 100 m channel is 90 m of horizontal cable in the walls plus up to 10 m of patch cords at both ends. ' +
    'When someone says "the run is only 92 m, it should be fine", that 10 m of patch leads is what they have forgotten.',
  source: cite.standard('ANSI/TIA-568 series; IEEE 802.3 clause 40 for 1000BASE-T'),
  status: 'verified',
});

const fiberChoice = defineQuestion({
  ...T,
  id: 'n10-009.1.5.singlemode-vs-multimode',
  objective: '1.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A campus needs a 4 km fibre link between two buildings.\n\nWhich media and transceiver pairing is appropriate?',
  choices: [
    'Single-mode fibre with long-wavelength transceivers',
    'Multimode OM3 fibre with short-wavelength transceivers',
    'Cat 6a shielded copper',
    'Multimode OM1 fibre with long-wavelength transceivers',
  ],
  answer: 0,
  whyWrong: {
    1: 'Multimode is limited to a few hundred metres at 10 Gbps because of modal dispersion.',
    2: 'Copper stops at 100 m regardless of category.',
    3: 'Mixing a long-wavelength transceiver with multimode fibre is a mismatch, and OM1 is the shortest-reach multimode grade.',
  },
  explain:
    'Single-mode has a core narrow enough (around 9 µm) that light travels one path, so it stays coherent over ' +
    'kilometres. Multimode has a wider core, cheaper optics, and modal dispersion that limits it to campus ' +
    'distances. The rule of thumb: inside a building, multimode; between buildings or across town, single-mode.',
  source: cite.standard('ITU-T G.652 (single-mode); ISO/IEC 11801 OM designations'),
  status: 'verified',
});

const t568b = defineQuestion({
  ...T,
  id: 'n10-009.1.5.t568b-pinout',
  objective: '1.5',
  kind: 'order',
  difficulty: 3,
  prompt: 'Put the T568B pin assignments in order, pin 1 first.',
  steps: [
    'White/Orange',
    'Orange',
    'White/Green',
    'Blue',
    'White/Blue',
    'Green',
    'White/Brown',
    'Brown',
  ],
  explain:
    'T568A and T568B differ only in that the orange and green pairs swap places. Either is fine as long as ' +
    'both ends of a patch cord match; a cable with A on one end and B on the other is a crossover. ' +
    'The blue pair stays on pins 4 and 5 in both standards.',
  source: cite.standard('ANSI/TIA-568.2-D'),
  status: 'verified',
});

// --- 1.6 Topologies and architectures -------------------------------------

const threeTier = defineQuestion({
  ...T,
  id: 'n10-009.1.6.three-tier',
  objective: '1.6',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each layer of the three-tier hierarchical model to its job.',
  pairs: [
    ['Access', 'Connects end devices; where PoE and port security live'],
    ['Distribution', 'Aggregates access switches, routes between VLANs, applies policy'],
    ['Core', 'Moves traffic between distribution blocks as fast as possible'],
  ],
  explain:
    'The point of the split is that each layer has one job. Policy and filtering belong at distribution; ' +
    'putting access lists in the core slows down the one layer whose only purpose is speed.',
  source: cite.todo('Confirm against the network architecture chapter of your study guide.'),
  status: 'draft',
});

const collisionVsBroadcast = defineQuestion({
  ...T,
  id: 'n10-009.1.6.broadcast-domains',
  objective: '1.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A single switch has 24 ports, all in the default VLAN, with a PC on every port.\n\n' +
    'How many collision domains and broadcast domains are there?',
  choices: [
    '24 collision domains, 1 broadcast domain',
    '1 collision domain, 24 broadcast domains',
    '1 collision domain, 1 broadcast domain',
    '24 collision domains, 24 broadcast domains',
  ],
  answer: 0,
  explain:
    'Every switch port is its own collision domain — that is the whole reason switches replaced hubs. ' +
    'Broadcasts, though, are flooded out of every port in the VLAN, so one VLAN is one broadcast domain. ' +
    'Splitting broadcast domains is what VLANs and routers are for.',
  source: cite.standard('IEEE 802.1D; IEEE 802.3 clause 4 (CSMA/CD)'),
  status: 'verified',
});

// --- 1.7 IPv4 addressing ---------------------------------------------------

const apipa = defineQuestion({
  ...T,
  id: 'n10-009.1.7.apipa-meaning',
  objective: '1.7',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'A workstation reports an address of 169.254.88.13 with mask 255.255.0.0 and no default gateway.\n\n' +
    'What does this tell you?',
  choices: [
    'It could not reach a DHCP server and self-assigned a link-local address',
    'It has been given a static address by an administrator',
    'It is behind a carrier-grade NAT',
    'Its network adapter has failed',
  ],
  answer: 0,
  whyWrong: {
    1: 'A static address would normally have a gateway and would not land in 169.254.0.0/16.',
    2: 'Carrier-grade NAT uses 100.64.0.0/10.',
    3: 'A failed adapter would show no link at all rather than a valid self-assigned address.',
  },
  explain:
    'APIPA covers 169.254.0.0/16 and is what a host assigns itself when DHCP does not answer. The host can ' +
    'still talk to others on the same segment that also self-assigned, which is why "I can reach my neighbour ' +
    'but nothing else" is the classic symptom. Look at the DHCP server, the scope, and anything in between — ' +
    'a relay, a trunk, a dead uplink.',
  source: cite.standard('RFC 3927 §2.1'),
  status: 'verified',
});

const rfc1918 = defineQuestion({
  ...T,
  id: 'n10-009.1.7.rfc1918-ranges',
  objective: '1.7',
  kind: 'multi',
  difficulty: 2,
  prompt: 'Which of these are private address ranges under RFC 1918? Select all that apply.',
  choices: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '169.254.0.0/16',
    '100.64.0.0/10',
  ],
  answers: [0, 1, 2],
  explain:
    'RFC 1918 defines exactly three: 10/8, 172.16/12 and 192.168/16. 169.254/16 is APIPA link-local (RFC 3927) ' +
    'and 100.64/10 is carrier-grade NAT space (RFC 6598) — both are non-routable on the internet but neither ' +
    'is RFC 1918. The 172 range is the one worth memorising precisely: 172.16.0.0 through 172.31.255.255, ' +
    'so 172.32.0.0 is public.',
  source: cite.standard('RFC 1918 §3'),
  status: 'verified',
});

// --- 1.8 Modern network environments --------------------------------------

const sdwan = defineQuestion({
  ...T,
  id: 'n10-009.1.8.sdwan-benefit',
  objective: '1.8',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A retailer has 200 branches, each with a cheap broadband circuit and an LTE backup. They want traffic ' +
    'steered per application, with policy pushed centrally rather than configured per site.\n\n' +
    'Which technology addresses this?',
  choices: [
    'SD-WAN',
    'A traditional MPLS mesh',
    'Spanning Tree Protocol',
    'A site-to-site IPsec tunnel per branch, managed by hand',
  ],
  answer: 0,
  explain:
    'SD-WAN separates the control plane from the transport, so policy lives centrally and each site can use ' +
    'whatever links it has. The features the exam associates with it are application awareness, ' +
    'zero-touch provisioning, transport agnosticism and central policy management — which is close to a ' +
    'restatement of this scenario.',
  source: cite.todo('Confirm against the SDN / SD-WAN section of your study guide.'),
  status: 'draft',
});

export const DOMAIN_1_QUESTIONS: readonly Question[] = [
  osiOrder,
  osiPdu,
  layerForDevice,
  proxyVsReverse,
  trafficTypes,
  dnsRecordTypes,
  copperDistance,
  fiberChoice,
  t568b,
  threeTier,
  collisionVsBroadcast,
  apipa,
  rfc1918,
  sdwan,
];
