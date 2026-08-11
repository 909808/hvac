import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Domain 2.0 — Network Implementation (20% of the exam). */

const T = { track: 'n10-009', domain: '2.0' } as const;

// --- 2.1 Routing and bandwidth management ---------------------------------

const routingProtocolTypes = defineQuestion({
  ...T,
  id: 'n10-009.2.1.protocol-families',
  objective: '2.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each routing protocol to its family.',
  pairs: [
    ['OSPF', 'Interior gateway, link-state'],
    ['EIGRP', 'Interior gateway, advanced distance-vector'],
    ['RIP', 'Interior gateway, distance-vector'],
    ['BGP', 'Exterior gateway, path-vector'],
  ],
  explain:
    'Link-state protocols flood topology information and each router computes the whole map itself, so they ' +
    'converge quickly. Distance-vector routers only know what their neighbours tell them. BGP is the odd one ' +
    'out: it runs between autonomous systems and chooses paths on policy, not on speed.',
  source: cite.standard('RFC 2328 (OSPF), RFC 2453 (RIPv2), RFC 4271 (BGP), RFC 7868 (EIGRP)'),
  status: 'verified',
});

const routeSelection = defineQuestion({
  ...T,
  id: 'n10-009.2.1.longest-prefix-match',
  objective: '2.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A router holds all of these routes. A packet arrives for 10.4.7.19.\n\n' +
    '  0.0.0.0/0     via 203.0.113.1\n' +
    '  10.0.0.0/8    via 10.1.1.1\n' +
    '  10.4.0.0/16   via 10.1.2.1\n' +
    '  10.4.7.0/24   via 10.1.3.1\n\n' +
    'Which next hop is used?',
  choices: ['10.1.3.1', '10.1.2.1', '10.1.1.1', '203.0.113.1'],
  answer: 0,
  explain:
    'Routers forward on longest prefix match: the most specific route that contains the destination wins, ' +
    'regardless of how the route was learned or what its metric is. 10.4.7.0/24 is a /24, which is more ' +
    'specific than /16, /8 or the default route, so 10.1.3.1 is the next hop. Administrative distance and ' +
    'metric only break ties between routes of the same prefix length.',
  source: cite.standard('RFC 1812 §5.2.4.3'),
  status: 'verified',
});

const qos = defineQuestion({
  ...T,
  id: 'n10-009.2.1.qos-voice',
  objective: '2.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Users report that voice calls break up whenever a large backup job runs, though throughput tests look fine.\n\n' +
    'Which measure most directly addresses this?',
  choices: [
    'Apply QoS marking and priority queuing for the voice traffic',
    'Increase the DHCP lease time',
    'Enable jumbo frames on the access switches',
    'Move the voice VLAN to a different IP range',
  ],
  answer: 0,
  whyWrong: {
    1: 'Lease time has nothing to do with how packets are queued.',
    2: 'Jumbo frames raise throughput efficiency but make head-of-line delay worse for small voice packets.',
    3: 'Renumbering changes addresses, not queueing behaviour.',
  },
  explain:
    'Voice is sensitive to jitter and latency rather than to raw bandwidth. Bulk transfers fill queues, and ' +
    'a full queue delays whatever is behind it. QoS marks voice (commonly DSCP EF) and gives it a priority ' +
    'queue so it jumps ahead of the backup traffic. "Throughput is fine but calls are bad" is the signature ' +
    'of a queueing problem, not a capacity problem.',
  source: cite.standard('RFC 4594 §2.3 (service class guidelines)'),
  status: 'verified',
});

// --- 2.2 Switching ---------------------------------------------------------

const vlanTrunk = defineQuestion({
  ...T,
  id: 'n10-009.2.2.dot1q-native',
  objective: '2.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Two switches are connected by an 802.1Q trunk. VLAN 10 and VLAN 20 pass correctly, but hosts in the ' +
    'native VLAN cannot reach each other across the link. The switches have different native VLAN IDs configured.\n\n' +
    'What is happening?',
  choices: [
    'Native VLAN traffic is sent untagged, so each switch places it into its own differing native VLAN',
    '802.1Q cannot carry more than two VLANs on one trunk',
    'The trunk needs Spanning Tree disabled to pass the native VLAN',
    'Untagged frames are always dropped on a trunk port',
  ],
  answer: 0,
  explain:
    'On an 802.1Q trunk the native VLAN is the one VLAN whose frames cross untagged. If one side calls that ' +
    'VLAN 1 and the other calls it VLAN 99, each switch drops the untagged frames into a different VLAN and ' +
    'the two never meet. It is also a security concern — mismatched native VLANs enable VLAN hopping — which ' +
    'is why the usual advice is to set the native VLAN explicitly and identically on both ends.',
  source: cite.standard('IEEE 802.1Q'),
  status: 'verified',
});

const stpPurpose = defineQuestion({
  ...T,
  id: 'n10-009.2.2.stp-purpose',
  objective: '2.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A technician patches a spare cable between two access switches that are already connected. Within seconds ' +
    'the whole VLAN goes unusable, switch CPUs spike, and MAC address tables churn.\n\n' +
    'Which protocol exists to prevent this?',
  choices: [
    'Spanning Tree Protocol',
    'Link Aggregation Control Protocol',
    'Address Resolution Protocol',
    'Dynamic Host Configuration Protocol',
  ],
  answer: 0,
  whyWrong: {
    1: 'LACP bundles links deliberately; it does not protect against an accidental loop on unrelated ports.',
    2: 'ARP resolves IP to MAC and is a victim of the storm, not a defence against it.',
    3: 'DHCP hands out addresses.',
  },
  explain:
    'A layer 2 loop has nothing to stop it — Ethernet frames have no TTL, so broadcasts circulate forever and ' +
    'multiply. The symptoms are exactly as described: a broadcast storm, CPU saturation, and MAC table ' +
    'instability as the same source appears on multiple ports. STP prevents it by blocking redundant paths ' +
    'until they are needed.',
  source: cite.standard('IEEE 802.1D; RSTP in IEEE 802.1w'),
  status: 'verified',
});

const portSecurity = defineQuestion({
  ...T,
  id: 'n10-009.2.2.poe-budget',
  objective: '2.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A 48-port switch with a 370 W PoE budget is fully populated with cameras that each draw 25.5 W. ' +
    'Some cameras come up and others stay dark, seemingly at random after a reboot.\n\n' +
    'What is the most likely cause?',
  choices: [
    'The total PoE power budget is exhausted, so later devices are denied power',
    'The switch is running out of MAC address table entries',
    'Spanning Tree is blocking the affected ports',
    'The cameras need a crossover cable',
  ],
  answer: 0,
  explain:
    '48 cameras at 25.5 W each would need over 1,200 W, far beyond a 370 W budget. A switch grants power ' +
    'until the budget runs out and then refuses the rest, so which cameras win depends on boot order — hence ' +
    'the apparent randomness after a reboot. Check the per-port and total power budget before assuming a fault: ' +
    'the port count on a switch tells you nothing about how many powered devices it can actually run.',
  source: cite.standard('IEEE 802.3at (PoE+, 25.5 W to the powered device)'),
  status: 'verified',
});

// --- 2.3 Wireless ----------------------------------------------------------

const wifiBands = defineQuestion({
  ...T,
  id: 'n10-009.2.3.wifi-generations',
  objective: '2.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each 802.11 amendment to the bands it uses and what it introduced.',
  pairs: [
    ['802.11b', '2.4 GHz, up to 11 Mbps'],
    ['802.11a', '5 GHz, up to 54 Mbps'],
    ['802.11g', '2.4 GHz, up to 54 Mbps, backward compatible with 802.11b'],
    ['802.11n (Wi-Fi 4)', '2.4 and 5 GHz, first to use MIMO and channel bonding'],
    ['802.11ac (Wi-Fi 5)', '5 GHz only, adds downlink MU-MIMO'],
    ['802.11ax (Wi-Fi 6/6E)', '2.4 and 5 GHz, plus 6 GHz for 6E, adds OFDMA'],
  ],
  explain:
    'The band matters more than the headline speed when you are troubleshooting. 2.4 GHz travels further and ' +
    'penetrates walls better but has only three non-overlapping channels and shares space with Bluetooth, ' +
    'microwaves and cordless phones. 5 GHz has far more channels and much less interference, at shorter range.',
  source: cite.standard('IEEE 802.11 amendments a/b/g/n/ac/ax'),
  status: 'verified',
});

const channelPlan = defineQuestion({
  ...T,
  id: 'n10-009.2.3.channel-overlap',
  objective: '2.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'In an office covered by several access points on 2.4 GHz, which channel plan avoids co-channel overlap?',
  choices: ['1, 6, 11', '1, 5, 9', '2, 7, 12', '1, 2, 3'],
  answer: 0,
  explain:
    'A 2.4 GHz channel is 22 MHz wide but the channels are spaced only 5 MHz apart, so adjacent channel ' +
    'numbers overlap heavily. Channels 1, 6 and 11 are the only three in the North American band that do not ' +
    'overlap at all. Overlapping APs do not simply share the air politely — they interfere, and throughput ' +
    'falls for everyone.',
  source: cite.standard('IEEE 802.11 clause 19 (DSSS/HR-DSSS channelisation)'),
  status: 'verified',
});

const wirelessSecurity = defineQuestion({
  ...T,
  id: 'n10-009.2.3.wpa3',
  objective: '2.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which wireless security option should be preferred on new deployments?',
  choices: ['WPA3', 'WPA2 with TKIP', 'WEP', 'An open network with MAC filtering'],
  answer: 0,
  whyWrong: {
    1: 'TKIP exists for backward compatibility with WEP-era hardware and is deprecated.',
    2: 'WEP is broken; its keys can be recovered in minutes.',
    3: 'MAC addresses are sent in the clear and trivially spoofed, so filtering them is not access control.',
  },
  explain:
    'WPA3 replaces the WPA2 pre-shared key handshake with SAE, which resists the offline dictionary attack ' +
    'that made weak WPA2 passphrases crackable from a captured handshake. If hardware forces WPA2, use ' +
    'WPA2-AES (CCMP) rather than TKIP, and use a long passphrase.',
  source: cite.standard('IEEE 802.11-2020 (SAE); Wi-Fi Alliance WPA3 specification'),
  status: 'verified',
});

// --- 2.4 Physical installations -------------------------------------------

const rackCooling = defineQuestion({
  ...T,
  id: 'n10-009.2.4.hot-cold-aisle',
  objective: '2.4',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'In a hot aisle / cold aisle data centre layout, how are the racks arranged?',
  choices: [
    'Rows face each other front-to-front and back-to-back, so intakes share one aisle and exhausts share another',
    'All racks face the same direction so air flows in one continuous path',
    'Racks alternate individually, one facing forward and the next facing backward',
    'Racks are placed against the walls with the centre of the room left clear',
  ],
  answer: 0,
  explain:
    'Equipment draws cool air at the front and exhausts hot air at the back. Facing rows front-to-front makes ' +
    'a cold aisle that feeds intakes, and back-to-back makes a hot aisle that the CRAC units collect from. ' +
    'Arrange racks all facing one way and each row breathes in the previous row\'s exhaust. This is exactly ' +
    'the airflow reasoning that carries over to HVAC work.',
  source: cite.todo('Confirm against the physical installation / data centre section of your study guide.'),
  status: 'draft',
});

export const DOMAIN_2_QUESTIONS: readonly Question[] = [
  routingProtocolTypes,
  routeSelection,
  qos,
  vlanTrunk,
  stpPurpose,
  portSecurity,
  wifiBands,
  channelPlan,
  wirelessSecurity,
  rackCooling,
];
