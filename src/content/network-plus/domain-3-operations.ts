import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Domain 3.0 — Network Operations (19% of the exam). */

const T = { track: 'n10-009', domain: '3.0' } as const;

// --- 3.1 Processes and procedures -----------------------------------------

const documentTypes = defineQuestion({
  ...T,
  id: 'n10-009.3.1.documentation-types',
  objective: '3.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each document to what it records.',
  pairs: [
    ['Physical network diagram', 'Where equipment actually sits and what is cabled to what'],
    ['Logical network diagram', 'IP addressing, VLANs and routing relationships'],
    ['Rack diagram', 'Unit-by-unit layout of equipment inside a cabinet'],
    ['Cable map', 'Which patch panel port terminates at which outlet'],
    ['IPAM', 'Which addresses and subnets are allocated, and to what'],
  ],
  explain:
    'The distinction that matters in practice is physical versus logical. When a link is down you want the ' +
    'physical diagram and the cable map. When traffic reaches the wrong place you want the logical diagram. ' +
    'Reaching for the wrong one is a common way to lose an hour.',
  source: cite.todo('Confirm the documentation list against your study guide.'),
  status: 'draft',
});

const changeManagement = defineQuestion({
  ...T,
  id: 'n10-009.3.1.rollback-plan',
  objective: '3.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A change request to replace a core switch has been written up with a business justification, a ' +
    'maintenance window and a test plan. What is the most important remaining element?',
  choices: [
    'A rollback plan describing how to return to the previous state',
    'A press release announcing the upgrade',
    'A new asset tag for the replacement switch',
    'A revised SLA with the internet provider',
  ],
  answer: 0,
  explain:
    'Change management assumes changes sometimes fail. The rollback plan is what turns a failed core switch ' +
    'swap from an outage into an inconvenience, and it has to be written before the window opens — at 2am, ' +
    'with the network down, is not when you want to be inventing one.',
  source: cite.todo('Confirm against the change management section of your study guide.'),
  status: 'draft',
});

// --- 3.2 Monitoring --------------------------------------------------------

const syslogSeverities = defineQuestion({
  ...T,
  id: 'n10-009.3.2.syslog-severity',
  objective: '3.2',
  kind: 'order',
  difficulty: 3,
  prompt: 'Put the syslog severity levels in order, level 0 first.',
  steps: [
    'Emergency (0)',
    'Alert (1)',
    'Critical (2)',
    'Error (3)',
    'Warning (4)',
    'Notice (5)',
    'Informational (6)',
    'Debug (7)',
  ],
  explain:
    'Lower number means more severe, which is the opposite of most people\'s instinct. Level 0 is a system ' +
    'that is unusable; level 7 is debugging noise. Configuring a collector to accept "level 4 and below" ' +
    'means warnings and everything worse — a useful default.',
  source: cite.standard('RFC 5424 §6.2.1'),
  status: 'verified',
});

const snmpTrap = defineQuestion({
  ...T,
  id: 'n10-009.3.2.snmp-trap-vs-poll',
  objective: '3.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A monitoring platform polls every switch every five minutes. The team wants to know within seconds when ' +
    'an uplink drops.\n\nWhat should they configure?',
  choices: [
    'SNMP traps sent from the switches to the manager on port 162',
    'A shorter DHCP lease on the management VLAN',
    'Additional SNMP GET polling on port 161 every five minutes',
    'Syslog rotation on the switches',
  ],
  answer: 0,
  explain:
    'Polling asks "how are you?" on a schedule, so the worst-case detection delay is the poll interval. ' +
    'A trap is the device volunteering "something just happened", sent to the manager on UDP 162 the moment ' +
    'it occurs. Use polling for trends and capacity, traps for events.',
  source: cite.standard('RFC 3411; RFC 3413 §3.3 (notification originator)'),
  status: 'verified',
});

const flowData = defineQuestion({
  ...T,
  id: 'n10-009.3.2.flow-vs-capture',
  objective: '3.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You need to know which internal hosts consumed the most WAN bandwidth yesterday, going back over a full ' +
    'month of history.\n\nWhich data source fits best?',
  choices: [
    'Network flow data collected from the WAN router',
    'A full packet capture of the WAN link',
    'Syslog messages from the access switches',
    'SNMP interface counters on the core switch',
  ],
  answer: 0,
  whyWrong: {
    1: 'Full captures of a WAN link for a month would be enormous and are usually kept for hours, not weeks.',
    2: 'Syslog records events, not per-conversation byte counts.',
    3: 'Interface counters give a total for the link but cannot break it down by host.',
  },
  explain:
    'Flow records summarise each conversation — source, destination, ports, byte and packet counts — without ' +
    'storing the payload. That is small enough to keep for months and detailed enough to rank talkers. ' +
    'Full packet capture gives you the contents but costs orders of magnitude more storage; reach for it when ' +
    'you need to see inside a specific conversation, not to answer "who is using the pipe".',
  source: cite.standard('RFC 7011 (IPFIX); RFC 3954 (NetFlow v9)'),
  status: 'verified',
});

// --- 3.3 Disaster recovery -------------------------------------------------

const rpoRto = defineQuestion({
  ...T,
  id: 'n10-009.3.3.rpo-vs-rto',
  objective: '3.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each recovery metric to its definition.',
  pairs: [
    ['RPO — Recovery Point Objective', 'How much data loss is acceptable, measured backwards from the failure'],
    ['RTO — Recovery Time Objective', 'How long the service may stay down before it must be restored'],
    ['MTTR — Mean Time To Repair', 'Average time actually taken to restore a failed component'],
    ['MTBF — Mean Time Between Failures', 'Average time a component runs before failing'],
  ],
  explain:
    'RPO and RTO are targets you choose; MTTR and MTBF are measurements you observe. The pair people mix up ' +
    'is RPO and RTO — RPO points backwards in time and is answered by backup frequency, RTO points forwards ' +
    'and is answered by how fast you can rebuild.',
  source: cite.todo('Confirm the DR metric definitions against your study guide.'),
  status: 'draft',
});

const siteTypes = defineQuestion({
  ...T,
  id: 'n10-009.3.3.site-types',
  objective: '3.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each recovery site type to its state of readiness.',
  pairs: [
    ['Hot site', 'Fully equipped and running with current data; switch over in minutes'],
    ['Warm site', 'Equipped with hardware and connectivity but needs data restored and services started'],
    ['Cold site', 'Space, power and cooling only; equipment must be brought in and built'],
  ],
  explain:
    'The trade is cost against recovery time. A hot site meets a tight RTO and costs the most because you are ' +
    'paying for a duplicate estate. A cold site is cheap but measured in days. Warm sits between the two and ' +
    'is where most organisations land.',
  source: cite.todo('Confirm the site definitions against your study guide.'),
  status: 'draft',
});

// --- 3.4 IPv4 and IPv6 services --------------------------------------------

const dhcpRelay = defineQuestion({
  ...T,
  id: 'n10-009.3.4.dhcp-relay',
  objective: '3.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Clients on VLAN 30 never receive an address and fall back to APIPA. The DHCP server sits on VLAN 10 and ' +
    'serves VLAN 10 clients correctly. A scope for VLAN 30 exists and is not exhausted.\n\n' +
    'What is required?',
  choices: [
    'A DHCP relay (IP helper) on the VLAN 30 gateway interface, pointing at the server',
    'A second DHCP server physically attached to VLAN 30',
    'A static route from VLAN 30 to VLAN 10',
    'A longer lease duration on the VLAN 30 scope',
  ],
  answer: 0,
  whyWrong: {
    1: 'It would work, but a relay achieves the same result without another server to maintain.',
    2: 'Routing between the VLANs is already working — the server answers VLAN 10 and the scope exists.',
    3: 'Lease duration is irrelevant when no lease is ever offered.',
  },
  explain:
    'A client with no address starts with DHCPDISCOVER as a broadcast to 255.255.255.255. Routers do not ' +
    'forward broadcasts, so the message dies at the VLAN boundary. A relay agent on the gateway catches it, ' +
    'records which subnet it came from in the giaddr field, and unicasts it to the server — which is also how ' +
    'the server knows which scope to draw from.',
  source: cite.standard('RFC 2131 §4.3.1; relay agent behaviour in RFC 2131 §4.1'),
  status: 'verified',
});

const ipv6LinkLocal = defineQuestion({
  ...T,
  id: 'n10-009.3.4.ipv6-link-local',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which IPv6 prefix identifies a link-local address?',
  choices: ['fe80::/10', 'fc00::/7', '2000::/3', '::1/128'],
  answer: 0,
  whyWrong: {
    1: 'fc00::/7 is unique local addressing, the rough IPv6 equivalent of RFC 1918.',
    2: '2000::/3 is global unicast — routable on the internet.',
    3: '::1 is the loopback, the IPv6 counterpart of 127.0.0.1.',
  },
  explain:
    'Every IPv6 interface gets a link-local address automatically, and it is never routed off the segment. ' +
    'Neighbour Discovery, router advertisements and many routing protocol adjacencies run over it, which is ' +
    'why an interface with only a link-local address is normal rather than a fault.',
  source: cite.standard('RFC 4291 §2.5.6'),
  status: 'verified',
});

const natTypes = defineQuestion({
  ...T,
  id: 'n10-009.3.4.pat',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A branch has one public IPv4 address and 60 workstations that all need internet access.\n\n' +
    'Which translation method makes this work?',
  choices: [
    'PAT — many private addresses share one public address, distinguished by source port',
    'Static one-to-one NAT for each workstation',
    'A dynamic NAT pool of 60 public addresses',
    'No translation; assign each workstation a public address',
  ],
  answer: 0,
  explain:
    'PAT (also called NAT overload) rewrites the source port as well as the source address, so the router can ' +
    'keep thousands of simultaneous conversations apart behind a single public address. Static NAT is ' +
    'one-to-one and is what you use to publish an inbound service; a dynamic pool still needs as many public ' +
    'addresses as concurrent hosts.',
  source: cite.standard('RFC 3022 §2.2 (NAPT)'),
  status: 'verified',
});

// --- 3.5 Access and management ---------------------------------------------

const outOfBand = defineQuestion({
  ...T,
  id: 'n10-009.3.5.out-of-band',
  objective: '3.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A misapplied ACL has cut off SSH to a remote router, and there is nobody on site.\n\n' +
    'Which access method would have preserved management access?',
  choices: [
    'An out-of-band console server reached over a separate cellular link',
    'A second SSH session opened before the change',
    'A web management interface on HTTPS',
    'An SNMP write community string',
  ],
  answer: 0,
  whyWrong: {
    1: 'An existing session is usually torn down by the same ACL, and cannot be re-established.',
    2: 'HTTPS traverses the same production path the ACL just blocked.',
    3: 'SNMP write also depends on the production path, and is a poor configuration channel besides.',
  },
  explain:
    'In-band management shares the network it manages, so it fails exactly when you need it. Out-of-band ' +
    'gives a separate path to the console port — a terminal server on a modem or cellular link — that keeps ' +
    'working when the data plane does not. This is the reason a rollback plan for a remote device is worth ' +
    'so little without out-of-band access.',
  source: cite.todo('Confirm against the network management methods section of your study guide.'),
  status: 'draft',
});

export const DOMAIN_3_QUESTIONS: readonly Question[] = [
  documentTypes,
  changeManagement,
  syslogSeverities,
  snmpTrap,
  flowData,
  rpoRto,
  siteTypes,
  dhcpRelay,
  ipv6LinkLocal,
  natTypes,
  outOfBand,
];
