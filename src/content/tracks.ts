import { defineTrack } from '@engine/define';
import type { Track } from '@engine/types';

/**
 * N10-009 domains and objectives.
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
  subtitle: 'Networking fundamentals, implementation, operations, security and troubleshooting',
  revision: 'N10-009',
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
 * HVAC controls track. Structure is a placeholder until the reference material
 * is chosen — domains here are a sketch, not an authority, which is why the
 * track carries no questions yet.
 */
export const HVAC_CONTROLS = defineTrack({
  id: 'hvac-controls',
  title: 'HVAC Controls',
  subtitle: 'Building automation, control sequences and field networking',
  revision: 'draft-0',
  domains: [
    {
      id: '1.0',
      title: 'Control Fundamentals',
      examWeight: 25,
      objectives: [
        { id: '1.1', title: 'Sensors, actuators and transducers' },
        { id: '1.2', title: 'Control loops, setpoints and PID behaviour' },
        { id: '1.3', title: 'Analogue and binary input/output signalling' },
      ],
    },
    {
      id: '2.0',
      title: 'Field Networking',
      examWeight: 25,
      objectives: [
        { id: '2.1', title: 'BACnet MS/TP and BACnet/IP' },
        { id: '2.2', title: 'Modbus RTU and Modbus TCP' },
        { id: '2.3', title: 'RS-485 topology, termination and biasing' },
      ],
    },
    {
      id: '3.0',
      title: 'Equipment and Sequences',
      examWeight: 25,
      objectives: [
        { id: '3.1', title: 'Air handling units and economizer sequences' },
        { id: '3.2', title: 'VAV boxes and terminal units' },
        { id: '3.3', title: 'Chilled and hot water plant control' },
      ],
    },
    {
      id: '4.0',
      title: 'Commissioning and Troubleshooting',
      examWeight: 25,
      objectives: [
        { id: '4.1', title: 'Point-to-point checkout and calibration' },
        { id: '4.2', title: 'Diagnosing control and comfort complaints' },
        { id: '4.3', title: 'Trend logs and alarm analysis' },
      ],
    },
  ],
}) satisfies Track;

export const TRACKS: readonly Track[] = [N10_009, HVAC_CONTROLS];

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
