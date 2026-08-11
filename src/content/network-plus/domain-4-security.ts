import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Domain 4.0 — Network Security (14% of the exam). */

const T = { track: 'n10-009', domain: '4.0' } as const;

// --- 4.1 Security concepts -------------------------------------------------

const ciaTriad = defineQuestion({
  ...T,
  id: 'n10-009.4.1.cia-triad',
  objective: '4.1',
  kind: 'match',
  difficulty: 1,
  prompt: 'Match each element of the CIA triad to the control that protects it.',
  pairs: [
    ['Confidentiality', 'Encryption of data in transit and at rest'],
    ['Integrity', 'Hashing and digital signatures'],
    ['Availability', 'Redundant links, load balancing and backups'],
  ],
  explain:
    'Encryption keeps data secret but does nothing to prove it has not been altered — that is what a hash or ' +
    'signature is for. Availability is the one people forget when listing security concerns, though a ' +
    'denial-of-service attack is a security incident just as much as a data breach is.',
  source: cite.todo('Confirm against the security fundamentals chapter of your study guide.'),
  status: 'draft',
});

const aaa = defineQuestion({
  ...T,
  id: 'n10-009.4.1.aaa',
  objective: '4.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each part of the AAA framework to what it establishes.',
  pairs: [
    ['Authentication', 'Who you are'],
    ['Authorization', 'What you are permitted to do'],
    ['Accounting', 'What you actually did, recorded for audit'],
  ],
  explain:
    'The three run in that order and are genuinely separate. A valid login that is then denied access to a ' +
    'resource is authentication succeeding and authorization failing — worth distinguishing when reading logs, ' +
    'because the fix is different in each case.',
  source: cite.standard('RFC 2903 (AAA architecture)'),
  status: 'verified',
});

const leastPrivilege = defineQuestion({
  ...T,
  id: 'n10-009.4.1.least-privilege',
  objective: '4.1',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'A helpdesk technician needs to reset user passwords. They are given full domain administrator rights ' +
    'because it is quicker to configure.\n\nWhich principle does this violate?',
  choices: [
    'Least privilege',
    'Defence in depth',
    'Separation of duties',
    'Implicit deny',
  ],
  answer: 0,
  explain:
    'Least privilege says an account gets the minimum access its job requires, and nothing more. The cost of ' +
    'over-granting is not just insider misuse — it is that a phished helpdesk account becomes a domain ' +
    'compromise rather than a password-reset nuisance.',
  source: cite.todo('Confirm against the security concepts section of your study guide.'),
  status: 'draft',
});

const zeroTrust = defineQuestion({
  ...T,
  id: 'n10-009.4.1.zero-trust',
  objective: '4.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which statement best captures a zero trust approach?',
  choices: [
    'Every request is authenticated and authorised regardless of where it originates',
    'The internal network is trusted and the perimeter firewall enforces security',
    'Trust is granted once at login and persists for the session',
    'Only traffic from the internet is inspected',
  ],
  answer: 0,
  explain:
    'Zero trust drops the assumption that "inside" means "safe". The traditional model built a hard perimeter ' +
    'around a soft interior, so anything that got in could move laterally with little resistance. Zero trust ' +
    'verifies each request on its own merits — identity, device posture, context — and segments the network so ' +
    'that a compromised host reaches very little.',
  source: cite.standard('NIST SP 800-207 §2'),
  status: 'verified',
});

// --- 4.2 Attacks -----------------------------------------------------------

const arpSpoofing = defineQuestion({
  ...T,
  id: 'n10-009.4.2.arp-spoofing',
  objective: '4.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'On a subnet, several workstations show the gateway IP mapped to an unexpected MAC address, and traffic ' +
    'that should leave the segment is being read by an unauthorised host first.\n\nWhat is happening?',
  choices: [
    'ARP spoofing enabling an on-path attack',
    'A DHCP scope exhaustion attack',
    'A VLAN hopping attack',
    'DNS cache poisoning',
  ],
  answer: 0,
  whyWrong: {
    1: 'Scope exhaustion stops clients getting addresses; it does not alter ARP entries.',
    2: 'VLAN hopping moves traffic between VLANs and would not rewrite the gateway MAC within one.',
    3: 'DNS poisoning changes name-to-address answers, not address-to-MAC ones.',
  },
  explain:
    'ARP has no authentication — a host will believe any ARP reply it receives. An attacker announces itself ' +
    'as the gateway, so victims send their off-segment traffic to it first. Dynamic ARP Inspection, working ' +
    'from the DHCP snooping binding table, is the switch feature that stops it.',
  source: cite.standard('RFC 826 (ARP, which specifies no authentication)'),
  status: 'verified',
});

const socialEngineering = defineQuestion({
  ...T,
  id: 'n10-009.4.2.social-engineering',
  objective: '4.2',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each social engineering technique to its description.',
  pairs: [
    ['Phishing', 'Mass email attempting to harvest credentials or deliver malware'],
    ['Spear phishing', 'Targeted message tailored to a specific individual or role'],
    ['Whaling', 'Targeting a senior executive specifically'],
    ['Vishing', 'The same con conducted over a voice call'],
    ['Tailgating', 'Following an authorised person through a physical door'],
  ],
  explain:
    'These differ in targeting and channel rather than in mechanism — all of them exploit a person rather than ' +
    'a protocol. That is also why the control is training and process (call back on a known number, verify ' +
    'out of band) rather than a device you can rack.',
  source: cite.todo('Confirm the attack definitions against your study guide.'),
  status: 'draft',
});

const dosVsDdos = defineQuestion({
  ...T,
  id: 'n10-009.4.2.dos-vs-ddos',
  objective: '4.2',
  kind: 'choice',
  difficulty: 1,
  prompt: 'What distinguishes a DDoS attack from a DoS attack?',
  choices: [
    'The traffic originates from many compromised hosts rather than one source',
    'It targets layer 7 rather than layer 3',
    'It aims to steal data rather than disrupt service',
    'It only affects wireless networks',
  ],
  answer: 0,
  explain:
    'The extra D is "distributed". One source can be blocked at the edge with a single rule; traffic arriving ' +
    'from tens of thousands of hosts across the internet cannot, which is why mitigation usually means ' +
    'upstream scrubbing by the provider rather than a filter on your own firewall.',
  source: cite.todo('Confirm against the attacks chapter of your study guide.'),
  status: 'draft',
});

// --- 4.3 Defence techniques ------------------------------------------------

const portSecurityDefence = defineQuestion({
  ...T,
  id: 'n10-009.4.3.dhcp-snooping',
  objective: '4.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A user plugs a home router into a wall port with its LAN side facing the corporate network. Machines ' +
    'nearby start receiving addresses in 192.168.1.0/24 with the wrong gateway.\n\n' +
    'Which switch feature prevents this?',
  choices: [
    'DHCP snooping, with only known uplink ports marked trusted',
    'Spanning Tree Protocol',
    'Link aggregation',
    'Jumbo frames',
  ],
  answer: 0,
  whyWrong: {
    1: 'STP prevents loops; a rogue DHCP server does not create one.',
    2: 'Link aggregation bundles links and is unrelated.',
    3: 'Frame size has no bearing on which server answers DHCP.',
  },
  explain:
    'DHCP snooping classifies ports as trusted or untrusted and drops server-sourced messages — OFFER and ACK — ' +
    'arriving on untrusted ports. It also builds a binding table of legitimate address-to-port mappings, which ' +
    'is what Dynamic ARP Inspection and IP Source Guard then check against, so enabling it buys you three ' +
    'defences for one.',
  source: cite.todo('Confirm the DHCP snooping description against your study guide.'),
  status: 'draft',
});

const dot1x = defineQuestion({
  ...T,
  id: 'n10-009.4.3.802-1x',
  objective: '4.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'An organisation wants devices to prove their identity before a switch port carries any user traffic.\n\n' +
    'Which standard provides this?',
  choices: [
    'IEEE 802.1X port-based network access control',
    'IEEE 802.1Q VLAN tagging',
    'IEEE 802.3af Power over Ethernet',
    'IEEE 802.11i wireless security',
  ],
  answer: 0,
  explain:
    '802.1X puts the port in an unauthorised state that passes only EAP traffic until a supplicant ' +
    'authenticates through the switch to a RADIUS server. Only then does the port carry data — and the server ' +
    'can push a VLAN or ACL with the acceptance, which is how guest and quarantine VLANs are assigned ' +
    'dynamically.',
  source: cite.standard('IEEE 802.1X'),
  status: 'verified',
});

const segmentation = defineQuestion({
  ...T,
  id: 'n10-009.4.3.segmentation',
  objective: '4.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A building has IP cameras, badge readers and HVAC controllers on the same VLAN as staff workstations.\n\n' +
    'What is the most effective first improvement?',
  choices: [
    'Move the building systems onto a separate VLAN with filtered access to and from the user network',
    'Change the wireless passphrase',
    'Shorten the DHCP lease time on the user VLAN',
    'Enable jumbo frames for the cameras',
  ],
  answer: 0,
  explain:
    'Building systems are typically slow to patch, ship with weak default credentials, and rarely need to talk ' +
    'to a workstation at all. Putting them in their own segment means a compromised controller cannot reach ' +
    'the user network and a compromised laptop cannot reach the controllers. This is the same argument for ' +
    'isolating a BAS network, and it is worth carrying into the HVAC track later.',
  source: cite.standard('NIST SP 800-207 §3 (network segmentation as a zero trust enabler)'),
  status: 'verified',
});

export const DOMAIN_4_QUESTIONS: readonly Question[] = [
  ciaTriad,
  aaa,
  leastPrivilege,
  zeroTrust,
  arpSpoofing,
  socialEngineering,
  dosVsDdos,
  portSecurityDefence,
  dot1x,
  segmentation,
];
