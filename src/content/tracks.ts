import { defineTrack } from '@engine/define';
import type { Track } from '@engine/types';

/**
 * N10-009 domains and objectives.
 *
 * ARCHIVED. HVAC is the focus of this app; Network+ is shelved rather than
 * removed — the content is intact, it still plays, and it is reachable from the
 * "show archived" toggle on the track switcher. Nothing here is maintained
 * actively, and none of it is on the path.
 *
 * Domain weightings drive exam-mode question allocation, so they matter beyond
 * being labels. Weightings and objective numbering below follow CompTIA's
 * published N10-009 objectives (exam objectives v4.0, exam launched 20 June
 * 2024).
 *
 * Worth doing once: download the official objectives PDF from CompTIA and read
 * the titles against this file. It is the single source of truth, it is free,
 * and if anything here has drifted this is the file to fix — nothing else
 * depends on the wording.
 */
export const N10_009 = defineTrack({
  id: 'n10-009',
  title: 'CompTIA Network+',
  subtitle: 'Archived — kept for reference, not on the HVAC path',
  revision: 'N10-009',
  archived: true,
  domains: [
    {
      id: '1.0',
      title: 'Networking Concepts',
      examWeight: 23,
      objectives: [
        { id: '1.1', title: 'Explain concepts related to the OSI reference model' },
        { id: '1.2', title: 'Compare and contrast networking appliances, applications, and functions' },
        { id: '1.3', title: 'Summarize cloud concepts and connectivity options' },
        { id: '1.4', title: 'Explain common networking ports, protocols, services, and traffic types' },
        { id: '1.5', title: 'Compare and contrast transmission media and transceivers' },
        { id: '1.6', title: 'Compare and contrast network topologies, architectures, and types' },
        { id: '1.7', title: 'Given a scenario, use appropriate IPv4 network addressing' },
        { id: '1.8', title: 'Summarize evolving use cases for modern network environments' },
      ],
    },
    {
      id: '2.0',
      title: 'Network Implementation',
      examWeight: 20,
      objectives: [
        { id: '2.1', title: 'Explain characteristics of routing technologies and bandwidth management' },
        { id: '2.2', title: 'Given a scenario, configure switching technologies and features' },
        { id: '2.3', title: 'Given a scenario, select and configure wireless devices and technologies' },
        { id: '2.4', title: 'Explain important factors of physical installations' },
      ],
    },
    {
      id: '3.0',
      title: 'Network Operations',
      examWeight: 19,
      objectives: [
        { id: '3.1', title: 'Explain the purpose of organizational processes and procedures' },
        { id: '3.2', title: 'Given a scenario, use network monitoring technologies' },
        { id: '3.3', title: 'Explain disaster recovery (DR) concepts' },
        { id: '3.4', title: 'Given a scenario, implement IPv4 and IPv6 network services' },
        { id: '3.5', title: 'Compare and contrast network access and management methods' },
      ],
    },
    {
      id: '4.0',
      title: 'Network Security',
      examWeight: 14,
      objectives: [
        { id: '4.1', title: 'Explain the importance of basic network security concepts' },
        { id: '4.2', title: 'Summarize various types of attacks and their impact to the network' },
        {
          id: '4.3',
          title: 'Given a scenario, apply network security features, defense techniques, and solutions',
        },
      ],
    },
    {
      id: '5.0',
      title: 'Network Troubleshooting',
      examWeight: 24,
      objectives: [
        { id: '5.1', title: 'Explain the troubleshooting methodology' },
        {
          id: '5.2',
          title: 'Given a scenario, troubleshoot common cabling and physical interface issues',
        },
        { id: '5.3', title: 'Given a scenario, troubleshoot common issues with network services' },
        { id: '5.4', title: 'Given a scenario, troubleshoot common performance issues' },
        {
          id: '5.5',
          title: 'Given a scenario, use the appropriate tool or protocol to solve networking issues',
        },
      ],
    },
  ],
}) satisfies Track;

/**
 * HVAC — the main track.
 *
 * Ten sectors covering the working body of residential and light-commercial
 * HVAC: the physics, the refrigeration cycle, refrigerants and the EPA rules
 * around them, charging, electrical, air distribution, psychrometrics, heating,
 * heat pumps, and the diagnostic method that ties it together.
 *
 * The sector order is a dependency claim, and the checkpoints enforce it. You
 * cannot diagnose a charge fault before you know what superheat measures, and
 * superheat means nothing without the cycle. Deliberately out of scope:
 * proprietary building-automation platforms and controls integration — that is
 * a specialism with its own tooling, and simulating it without the real front
 * end would teach the wrong habits.
 *
 * Domain weights double as the share of a full-track review, so they are
 * weighted by how much of the work each sector actually accounts for rather
 * than being split evenly.
 */
export const HVAC = defineTrack({
  id: 'hvac',
  title: 'HVAC',
  subtitle: 'Refrigeration, airflow, electrical, heating and diagnostics',
  revision: 'Core v1',
  domains: [
    {
      id: '1.0',
      title: 'Fundamentals & Safety',
      examWeight: 8,
      objectives: [
        { id: '1.1', title: 'Heat, temperature and the units the trade measures in' },
        { id: '1.2', title: 'Sensible heat, latent heat and change of state' },
        { id: '1.3', title: 'Pressure, vacuum, and absolute versus gauge' },
        { id: '1.4', title: 'Heat transfer: conduction, convection and radiation' },
        { id: '1.5', title: 'Tools, instruments and their correct use' },
        { id: '1.6', title: 'Job-site safety, PPE, electrical and refrigerant hazards' },
      ],
    },
    {
      id: '2.0',
      title: 'The Refrigeration Cycle',
      examWeight: 13,
      objectives: [
        { id: '2.1', title: 'The four components and what each one does' },
        { id: '2.2', title: 'Following state through the cycle' },
        { id: '2.3', title: 'The pressure–temperature relationship' },
        { id: '2.4', title: 'Superheat: what it measures and why' },
        { id: '2.5', title: 'Subcooling: what it measures and why' },
        { id: '2.6', title: 'Condenser split and heat rejection' },
      ],
    },
    {
      id: '3.0',
      title: 'Refrigerants & EPA 608',
      examWeight: 10,
      objectives: [
        { id: '3.1', title: 'Refrigerant families, numbering and blends' },
        { id: '3.2', title: 'Oils, compatibility and moisture' },
        { id: '3.3', title: 'Recovery, recycling and reclamation' },
        { id: '3.4', title: 'Cylinders, handling and safe practice' },
        { id: '3.5', title: 'Leak detection, evacuation and dehydration' },
        { id: '3.6', title: 'Regulations, certification and venting prohibitions' },
      ],
    },
    {
      id: '4.0',
      title: 'Metering Devices & Charging',
      examWeight: 10,
      objectives: [
        { id: '4.1', title: 'Fixed orifice, TXV and EEV compared' },
        { id: '4.2', title: 'Charging by superheat' },
        { id: '4.3', title: 'Charging by subcooling' },
        { id: '4.4', title: 'Weighing in a charge and total system charge' },
        { id: '4.5', title: 'Recognising over- and undercharge from the readings' },
      ],
    },
    {
      id: '5.0',
      title: 'Electrical Fundamentals',
      examWeight: 13,
      objectives: [
        { id: '5.1', title: "Ohm's law, power and circuit behaviour" },
        { id: '5.2', title: 'Series and parallel circuits' },
        { id: '5.3', title: 'Motors, windings and start components' },
        { id: '5.4', title: 'Capacitors: run, start and testing' },
        { id: '5.5', title: 'Contactors, relays, transformers and controls' },
        { id: '5.6', title: 'Reading a ladder diagram and tracing a circuit' },
        { id: '5.7', title: 'Safe meter use and electrical troubleshooting' },
      ],
    },
    {
      id: '6.0',
      title: 'Airflow & Duct Systems',
      examWeight: 11,
      objectives: [
        { id: '6.1', title: 'CFM, velocity and airflow measurement' },
        { id: '6.2', title: 'Static pressure and total external static' },
        { id: '6.3', title: 'The fan laws' },
        { id: '6.4', title: 'Duct sizing, friction rate and equivalent length' },
        { id: '6.5', title: 'Blowers, motors and airflow adjustment' },
        { id: '6.6', title: 'Filtration, MERV and the airflow it costs' },
      ],
    },
    {
      id: '7.0',
      title: 'Psychrometrics',
      examWeight: 9,
      objectives: [
        { id: '7.1', title: 'Dry bulb, wet bulb, dew point and relative humidity' },
        { id: '7.2', title: 'Reading the psychrometric chart' },
        { id: '7.3', title: 'Sensible, latent and total heat' },
        { id: '7.4', title: 'Sensible heat ratio and equipment selection' },
        { id: '7.5', title: 'Comfort, ventilation and humidity control' },
      ],
    },
    {
      id: '8.0',
      title: 'Heating: Furnaces & Boilers',
      examWeight: 12,
      objectives: [
        { id: '8.1', title: 'Combustion, fuels and the air it needs' },
        { id: '8.2', title: 'Gas furnace sequence of operation' },
        { id: '8.3', title: 'Ignition systems and flame proving' },
        { id: '8.4', title: 'Heat exchangers, efficiency and condensing furnaces' },
        { id: '8.5', title: 'Venting categories and combustion air' },
        { id: '8.6', title: 'Boilers, hydronics and steam basics' },
        { id: '8.7', title: 'Electric heat and supplementary heating' },
      ],
    },
    {
      id: '9.0',
      title: 'Heat Pumps',
      examWeight: 7,
      objectives: [
        { id: '9.1', title: 'The reversing valve and refrigerant flow in each mode' },
        { id: '9.2', title: 'Defrost: initiation, termination and controls' },
        { id: '9.3', title: 'Auxiliary and emergency heat' },
        { id: '9.4', title: 'Balance point and capacity at low ambient' },
        { id: '9.5', title: 'Charging and checking a heat pump' },
      ],
    },
    {
      id: '10.0',
      title: 'Diagnostics & Service',
      examWeight: 7,
      objectives: [
        { id: '10.1', title: 'A systematic troubleshooting method' },
        { id: '10.2', title: 'Reading the gauges as a set, not one at a time' },
        { id: '10.3', title: 'Separating airflow faults from charge faults' },
        { id: '10.4', title: 'Compressor and electrical failure diagnosis' },
        { id: '10.5', title: 'Documentation, callbacks and customer communication' },
      ],
    },
  ],
  sectors: [
    {
      id: '1.0',
      order: 1,
      title: 'Fundamentals & Safety',
      blurb:
        'What heat actually is, how it moves, and the units everything else is measured in. ' +
        'Nothing later makes sense without this.',
      glyph: '🌡',
      labs: [],
      checkpoint: { questions: 10, passPercent: 75 },
    },
    {
      id: '2.0',
      order: 2,
      title: 'The Refrigeration Cycle',
      blurb:
        'The loop at the centre of the trade. Ends with superheat and subcooling — the two ' +
        'numbers that tell you what is happening inside a sealed system.',
      glyph: '♻',
      labs: ['pt-chart', 'superheat-subcooling'],
      checkpoint: { questions: 12, passPercent: 75 },
    },
    {
      id: '3.0',
      order: 3,
      title: 'Refrigerants & EPA 608',
      blurb:
        'What is in the system, what it does to oil and moisture, and the law around handling ' +
        'it. The certification content lives here.',
      glyph: '⚗',
      labs: ['pt-chart'],
      checkpoint: { questions: 12, passPercent: 80 },
    },
    {
      id: '4.0',
      order: 4,
      title: 'Metering Devices & Charging',
      blurb:
        'How refrigerant gets into the evaporator, and how to put the right amount in. ' +
        'Superheat for fixed orifice, subcooling for TXV, and why the difference matters.',
      glyph: '⚙',
      labs: ['superheat-subcooling', 'service-call'],
      checkpoint: { questions: 10, passPercent: 80 },
    },
    {
      id: '5.0',
      order: 5,
      title: 'Electrical Fundamentals',
      blurb:
        'Ohm\'s law through to reading a ladder diagram. Most no-cool calls turn out to be ' +
        'electrical, and this is where the meter earns its keep.',
      glyph: '⚡',
      labs: ['electrical'],
      checkpoint: { questions: 12, passPercent: 75 },
    },
    {
      id: '6.0',
      order: 6,
      title: 'Airflow & Duct Systems',
      blurb:
        'The side of the job that gets skipped and causes the most callbacks. Static pressure, ' +
        'the fan laws, and why 400 CFM per ton is not a suggestion.',
      glyph: '💨',
      labs: ['airflow'],
      checkpoint: { questions: 10, passPercent: 75 },
    },
    {
      id: '7.0',
      order: 7,
      title: 'Psychrometrics',
      blurb:
        'Air with moisture in it. The chart, the four heat formulas, and why a system can hit ' +
        'temperature and still leave the house uncomfortable.',
      glyph: '📊',
      labs: ['psychrometrics', 'heat-load'],
      checkpoint: { questions: 10, passPercent: 75 },
    },
    {
      id: '8.0',
      order: 8,
      title: 'Heating: Furnaces & Boilers',
      blurb:
        'Combustion, the furnace sequence of operation step by step, venting categories, and ' +
        'hydronics. The half of the trade that runs in winter.',
      glyph: '🔥',
      labs: [],
      checkpoint: { questions: 12, passPercent: 75 },
    },
    {
      id: '9.0',
      order: 9,
      title: 'Heat Pumps',
      blurb:
        'One system running the cycle in both directions. Reversing valves, defrost, auxiliary ' +
        'heat and the balance point.',
      glyph: '🔄',
      labs: ['superheat-subcooling'],
      checkpoint: { questions: 10, passPercent: 75 },
    },
    {
      id: '10.0',
      order: 10,
      title: 'Diagnostics & Service',
      blurb:
        'Putting it together. Reading the gauges as a set, telling airflow faults from charge ' +
        'faults, and working a call methodically instead of by guess.',
      glyph: '🔧',
      labs: ['service-call'],
      checkpoint: { questions: 12, passPercent: 80 },
    },
  ],
}) satisfies Track;

export const TRACKS: readonly Track[] = [HVAC, N10_009];

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function objectiveTitle(track: Track, objectiveId: string): string {
  for (const domain of track.domains) {
    const found = domain.objectives.find((o) => o.id === objectiveId);
    if (found) return found.title;
  }
  return objectiveId;
}

export function domainTitle(track: Track, domainId: string): string {
  return track.domains.find((d) => d.id === domainId)?.title ?? domainId;
}
