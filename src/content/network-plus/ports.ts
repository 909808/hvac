/**
 * The ports and protocols N10-009 objective 1.4 expects on recall.
 *
 * These are registry facts rather than anybody's opinion, so they are cited to
 * the IANA Service Name and Transport Protocol Port Number Registry and to the
 * RFC that defines each service. That makes them the most reliable content in
 * the app — worth knowing when you are deciding what to trust.
 */

export interface PortEntry {
  readonly protocol: string;
  readonly ports: readonly number[];
  readonly transport: 'TCP' | 'UDP' | 'TCP/UDP';
  /** One line on what it is for, shown in the reveal panel. */
  readonly purpose: string;
  readonly reference: string;
  /** True where the protocol carries credentials or data in the clear. */
  readonly insecure?: boolean;
  /** The encrypted replacement, where one exists. Used to build questions. */
  readonly secureAlternative?: string;
}

export const PORTS: readonly PortEntry[] = [
  {
    protocol: 'FTP',
    ports: [20, 21],
    transport: 'TCP',
    purpose: 'File transfer — 21 carries commands, 20 carries data in active mode',
    reference: 'RFC 959',
    insecure: true,
    secureAlternative: 'SFTP or FTPS',
  },
  {
    protocol: 'SSH',
    ports: [22],
    transport: 'TCP',
    purpose: 'Encrypted remote shell and tunnelling',
    reference: 'RFC 4251',
  },
  {
    protocol: 'SFTP',
    ports: [22],
    transport: 'TCP',
    purpose: 'File transfer carried inside an SSH session — not the same thing as FTPS',
    reference: 'RFC 4251',
  },
  {
    protocol: 'Telnet',
    ports: [23],
    transport: 'TCP',
    purpose: 'Remote terminal, entirely in plaintext including the password',
    reference: 'RFC 854',
    insecure: true,
    secureAlternative: 'SSH',
  },
  {
    protocol: 'SMTP',
    ports: [25],
    transport: 'TCP',
    purpose: 'Mail transfer between servers',
    reference: 'RFC 5321',
    insecure: true,
    secureAlternative: 'SMTP with STARTTLS on 587',
  },
  {
    protocol: 'DNS',
    ports: [53],
    transport: 'TCP/UDP',
    purpose: 'Name resolution — UDP for queries, TCP for zone transfers and large responses',
    reference: 'RFC 1035',
  },
  {
    protocol: 'DHCP',
    ports: [67, 68],
    transport: 'UDP',
    purpose: 'Address assignment — 67 is the server, 68 is the client',
    reference: 'RFC 2131',
  },
  {
    protocol: 'TFTP',
    ports: [69],
    transport: 'UDP',
    purpose: 'Trivial file transfer, typically for device firmware and config backup',
    reference: 'RFC 1350',
    insecure: true,
    secureAlternative: 'SFTP',
  },
  {
    protocol: 'HTTP',
    ports: [80],
    transport: 'TCP',
    purpose: 'Web traffic in the clear',
    reference: 'RFC 9110',
    insecure: true,
    secureAlternative: 'HTTPS',
  },
  {
    protocol: 'POP3',
    ports: [110],
    transport: 'TCP',
    purpose: 'Mail retrieval, traditionally downloading and deleting from the server',
    reference: 'RFC 1939',
    insecure: true,
    secureAlternative: 'POP3S on 995',
  },
  {
    protocol: 'NTP',
    ports: [123],
    transport: 'UDP',
    purpose: 'Time synchronisation — clock skew breaks Kerberos and certificate validation',
    reference: 'RFC 5905',
  },
  {
    protocol: 'IMAP',
    ports: [143],
    transport: 'TCP',
    purpose: 'Mail access that leaves messages on the server and syncs state',
    reference: 'RFC 9051',
    insecure: true,
    secureAlternative: 'IMAPS on 993',
  },
  {
    protocol: 'SNMP',
    ports: [161, 162],
    transport: 'UDP',
    purpose: 'Device monitoring — 161 for polling, 162 for traps sent to the manager',
    reference: 'RFC 3411',
  },
  {
    protocol: 'LDAP',
    ports: [389],
    transport: 'TCP',
    purpose: 'Directory lookups, the backbone of Active Directory queries',
    reference: 'RFC 4511',
    insecure: true,
    secureAlternative: 'LDAPS on 636',
  },
  {
    protocol: 'HTTPS',
    ports: [443],
    transport: 'TCP',
    purpose: 'Web traffic protected by TLS',
    reference: 'RFC 9110 / RFC 8446',
  },
  {
    protocol: 'SMB',
    ports: [445],
    transport: 'TCP',
    purpose: 'Windows file and printer sharing',
    reference: 'MS-SMB2',
  },
  {
    protocol: 'Syslog',
    ports: [514],
    transport: 'UDP',
    purpose: 'Log shipping to a central collector',
    reference: 'RFC 5424',
  },
  {
    protocol: 'SMTP (submission, TLS)',
    ports: [587],
    transport: 'TCP',
    purpose: 'Mail submission from a client, with STARTTLS',
    reference: 'RFC 6409',
  },
  {
    protocol: 'LDAPS',
    ports: [636],
    transport: 'TCP',
    purpose: 'Directory lookups over TLS',
    reference: 'RFC 4513',
  },
  {
    protocol: 'IMAPS',
    ports: [993],
    transport: 'TCP',
    purpose: 'IMAP wrapped in TLS',
    reference: 'RFC 8314',
  },
  {
    protocol: 'POP3S',
    ports: [995],
    transport: 'TCP',
    purpose: 'POP3 wrapped in TLS',
    reference: 'RFC 8314',
  },
  {
    protocol: 'SQL Server',
    ports: [1433],
    transport: 'TCP',
    purpose: 'Microsoft SQL Server database connections',
    reference: 'IANA service name ms-sql-s',
  },
  {
    protocol: 'RDP',
    ports: [3389],
    transport: 'TCP',
    purpose: 'Windows Remote Desktop',
    reference: 'MS-RDPBCGR',
  },
  {
    protocol: 'SIP',
    ports: [5060, 5061],
    transport: 'TCP/UDP',
    purpose: 'VoIP call setup — 5060 in the clear, 5061 over TLS',
    reference: 'RFC 3261',
  },
];

export function portsFor(protocol: string): PortEntry | undefined {
  return PORTS.find((p) => p.protocol.toLowerCase() === protocol.toLowerCase());
}

/** Formats "20, 21" or "53" for display. */
export function formatPorts(entry: PortEntry): string {
  return entry.ports.join(', ');
}
