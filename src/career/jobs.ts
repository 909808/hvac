import type { Rng } from '@engine/rng';
import type { DistrictId, Job, JobTemplate, RankId, ToolId } from './types';
import { toolsMissingFor } from './tools';
import { district, meetsRank } from './world';

/**
 * The job board.
 *
 * Every template states what it needs in three currencies: **knowledge**
 * (sectors of the curriculum passed), **tools** (things in the van), and
 * **standing** (rank and reputation). That is the whole progression system —
 * there is no separate skill tree, because inventing one alongside a
 * curriculum would be inventing a second, fake version of the same thing.
 *
 * Pay scales with what the work demands. A filter change is a filter change;
 * a data centre call at 2am is not.
 */
export const JOB_TEMPLATES: readonly JobTemplate[] = [
  // --- school / entry ------------------------------------------------------
  {
    id: 'ridealong',
    sector: 'residential',
    title: 'Ride-along',
    complaint: 'Shadow a tech for the afternoon. Carry things, watch, ask questions.',
    resolution: 'knowledge',
    districts: ['school'],
    requiresSectors: [],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 0,
    pay: 60,
    minutes: 120,
    reputation: 1,
    quizDomain: '1.0',
  },
  {
    id: 'shop-cleanup',
    sector: 'residential',
    title: 'Shop day',
    complaint: 'Inventory the truck stock and help load installs. Nobody grows up doing this forever.',
    resolution: 'routine',
    districts: ['school'],
    requiresSectors: [],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 0,
    pay: 45,
    minutes: 90,
    reputation: 0,
  },
  {
    id: 'safety-check',
    sector: 'residential',
    title: 'Safety walkthrough',
    complaint: 'The school wants the lab checked over before the new intake arrives.',
    resolution: 'knowledge',
    districts: ['school'],
    requiresSectors: ['1.0'],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 0,
    pay: 95,
    minutes: 90,
    reputation: 2,
    quizDomain: '1.0',
  },
  {
    id: 'teardown-lab',
    sector: 'residential',
    title: 'Tear-down lab',
    complaint: 'Strip a scrapped condensing unit down to components and lay them out on the bench.',
    resolution: 'routine',
    districts: ['school'],
    requiresSectors: [],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 0,
    pay: 55,
    minutes: 90,
    reputation: 1,
  },
  {
    id: 'filter-run',
    sector: 'residential',
    title: 'Filter run',
    complaint: 'Four rental units on a maintenance contract. Change the filters, note anything odd.',
    resolution: 'routine',
    districts: ['suburbs'],
    requiresSectors: [],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 0,
    pay: 85,
    minutes: 105,
    reputation: 1,
  },
  {
    id: 'install-helper',
    sector: 'install',
    title: 'Install helper',
    complaint: 'Second pair of hands on a changeout. Carry the line set, hold the level, watch the brazing.',
    resolution: 'routine',
    districts: ['suburbs', 'school'],
    requiresSectors: [],
    requiresTools: [],
    requiresRank: 'student',
    retiresAt: 'technician',
    requiresReputation: 2,
    pay: 130,
    minutes: 210,
    reputation: 2,
  },
  {
    id: 'attic-survey',
    sector: 'residential',
    title: 'Attic survey',
    complaint: 'Insurance wants the equipment in the attic photographed and the hazards written up.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['1.0'],
    requiresTools: [],
    requiresRank: 'student',
    requiresReputation: 3,
    pay: 110,
    minutes: 90,
    reputation: 2,
    quizDomain: '1.0',
  },

  // --- residential maintenance --------------------------------------------
  {
    id: 'filter-change',
    sector: 'residential',
    title: 'Filter and coil clean',
    complaint: 'Annual maintenance. Filter, coil, drain, and a look over everything.',
    resolution: 'routine',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['1.0'],
    requiresTools: [],
    requiresRank: 'apprentice',
    requiresReputation: 0,
    pay: 120,
    minutes: 60,
    reputation: 2,
  },
  {
    id: 'condenser-wash',
    sector: 'residential',
    title: 'Condenser wash',
    complaint: 'Unit is outside under a cottonwood. It has not been touched in four years.',
    resolution: 'routine',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['1.0'],
    requiresTools: [],
    requiresRank: 'apprentice',
    requiresReputation: 4,
    pay: 145,
    minutes: 75,
    reputation: 2,
  },
  {
    id: 'thermostat-swap',
    sector: 'controls',
    title: 'Thermostat replacement',
    complaint: 'Customer bought a smart thermostat online and it keeps dropping offline.',
    resolution: 'knowledge',
    districts: ['suburbs', 'downtown'],
    requiresSectors: ['5.0'],
    requiresTools: ['multimeter'],
    requiresRank: 'apprentice',
    requiresReputation: 8,
    pay: 190,
    minutes: 75,
    reputation: 3,
    quizDomain: '5.0',
  },

  // --- residential diagnostic ----------------------------------------------
  {
    id: 'no-cool-basic',
    sector: 'residential',
    title: 'No cooling',
    complaint: 'It runs but the house is not getting cold.',
    resolution: 'diagnose',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['1.0', '2.0'],
    requiresTools: ['manifold-gauges', 'thermocouple'],
    requiresRank: 'apprentice',
    requiresReputation: 6,
    pay: 240,
    minutes: 90,
    reputation: 4,
    tier: 1,
  },
  {
    id: 'freezing-up',
    sector: 'residential',
    title: 'Coil freezing over',
    complaint: 'There is ice on the indoor unit and hardly any air coming out.',
    resolution: 'diagnose',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['1.0', '2.0', '6.0'],
    requiresTools: ['manifold-gauges', 'thermocouple'],
    requiresRank: 'technician',
    requiresReputation: 15,
    pay: 310,
    minutes: 105,
    reputation: 5,
    tier: 1,
  },
  {
    id: 'airflow-complaint',
    sector: 'residential',
    title: 'Weak airflow, back bedrooms',
    complaint: 'Front of the house is fine. The back never cools. It has always been like this.',
    resolution: 'knowledge',
    districts: ['suburbs'],
    requiresSectors: ['6.0'],
    requiresTools: ['manometer'],
    requiresRank: 'technician',
    requiresReputation: 20,
    pay: 285,
    minutes: 105,
    reputation: 5,
    quizDomain: '6.0',
  },
  {
    id: 'humidity-complaint',
    sector: 'residential',
    title: 'Hits setpoint but feels damp',
    complaint: 'Thermostat says 74 and the house still feels like a swamp.',
    resolution: 'knowledge',
    districts: ['suburbs', 'downtown'],
    requiresSectors: ['6.0', '7.0'],
    requiresTools: ['psychrometer', 'thermocouple'],
    requiresRank: 'technician',
    requiresReputation: 26,
    pay: 320,
    minutes: 105,
    reputation: 6,
    quizDomain: '7.0',
  },

  // --- charging / sealed system --------------------------------------------
  {
    id: 'leak-and-charge',
    sector: 'residential',
    title: 'Low on refrigerant',
    complaint: 'Somebody put gas in it last summer and it is down again.',
    resolution: 'diagnose',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['2.0', '3.0', '4.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'recovery-machine', 'vacuum-pump', 'refrigerant-scale'],
    requiresRank: 'technician',
    requiresReputation: 22,
    pay: 480,
    minutes: 150,
    reputation: 7,
    tier: 2,
  },
  {
    id: 'r22-service',
    sector: 'residential',
    title: 'R-22 system, poor cooling',
    complaint: 'Twenty-year-old unit. Owner wants to know whether it is worth keeping.',
    resolution: 'diagnose',
    districts: ['oldtown'],
    requiresSectors: ['2.0', '3.0', '4.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'recovery-machine'],
    requiresRank: 'technician',
    requiresReputation: 28,
    pay: 420,
    minutes: 135,
    reputation: 6,
    tier: 2,
  },

  // --- heating --------------------------------------------------------------
  {
    id: 'no-heat',
    sector: 'residential',
    title: 'No heat',
    complaint: 'Furnace lights, runs a few seconds, then shuts off. Over and over.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['8.0'],
    requiresTools: ['multimeter'],
    requiresRank: 'technician',
    requiresReputation: 18,
    pay: 265,
    minutes: 90,
    reputation: 5,
    quizDomain: '8.0',
  },
  {
    id: 'combustion-check',
    sector: 'residential',
    title: 'Combustion safety inspection',
    complaint: 'Realtor needs the furnace certified safe before closing.',
    resolution: 'knowledge',
    districts: ['oldtown', 'suburbs'],
    requiresSectors: ['8.0'],
    requiresTools: ['combustion-analyser'],
    requiresRank: 'lead',
    requiresReputation: 40,
    pay: 380,
    minutes: 105,
    reputation: 7,
    quizDomain: '8.0',
  },
  {
    id: 'heat-pump-aux',
    sector: 'residential',
    title: 'Heat pump running strips constantly',
    complaint: 'Electric bill has tripled since November.',
    resolution: 'knowledge',
    districts: ['suburbs'],
    requiresSectors: ['9.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter'],
    requiresRank: 'technician',
    requiresReputation: 32,
    pay: 340,
    minutes: 120,
    reputation: 6,
    quizDomain: '9.0',
  },

  // --- electrical -----------------------------------------------------------
  {
    id: 'wont-start',
    sector: 'residential',
    title: 'Outdoor unit hums and trips',
    complaint: 'It buzzes for a few seconds then the breaker goes.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown', 'downtown'],
    requiresSectors: ['5.0'],
    requiresTools: ['multimeter', 'clamp-meter'],
    requiresRank: 'technician',
    requiresReputation: 16,
    pay: 255,
    minutes: 90,
    reputation: 5,
    quizDomain: '5.0',
  },

  // --- light commercial -----------------------------------------------------
  {
    id: 'rtu-service',
    sector: 'light-commercial',
    title: 'Rooftop unit, poor cooling',
    complaint: 'Dining room is uncomfortable at lunch service. Owner is losing covers.',
    resolution: 'diagnose',
    districts: ['downtown'],
    requiresSectors: ['2.0', '3.0', '4.0', '6.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter', 'manometer'],
    requiresRank: 'technician',
    requiresReputation: 34,
    pay: 620,
    minutes: 165,
    reputation: 8,
    tier: 2,
  },
  {
    id: 'office-comfort',
    sector: 'light-commercial',
    title: 'Office comfort complaints',
    complaint: 'Half the floor is cold, the other half is hot. Nobody agrees on anything.',
    resolution: 'knowledge',
    districts: ['downtown'],
    requiresSectors: ['6.0', '7.0'],
    requiresTools: ['manometer', 'psychrometer', 'thermocouple'],
    requiresRank: 'lead',
    requiresReputation: 45,
    pay: 560,
    minutes: 150,
    reputation: 8,
    quizDomain: '6.0',
  },

  // --- refrigeration --------------------------------------------------------
  {
    id: 'walkin-cooler',
    sector: 'refrigeration',
    title: 'Walk-in cooler running warm',
    complaint: 'Box is sitting at 48 degrees. There is a lot of product in there.',
    resolution: 'diagnose',
    districts: ['industrial', 'downtown'],
    requiresSectors: ['2.0', '3.0', '4.0', '10.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter', 'recovery-machine'],
    requiresRank: 'lead',
    requiresReputation: 58,
    pay: 780,
    minutes: 180,
    reputation: 10,
    tier: 3,
  },
  {
    id: 'freezer-down',
    sector: 'refrigeration',
    title: 'Freezer down, product at risk',
    complaint: 'Low-temp box is climbing. They have about four hours before it costs real money.',
    resolution: 'diagnose',
    districts: ['industrial'],
    requiresSectors: ['2.0', '3.0', '4.0', '10.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter', 'recovery-machine', 'leak-detector'],
    requiresRank: 'lead',
    requiresReputation: 66,
    pay: 950,
    minutes: 210,
    reputation: 12,
    tier: 3,
  },

  // --- data centre ----------------------------------------------------------
  {
    id: 'crac-unit',
    sector: 'data-center',
    title: 'CRAC unit alarming',
    complaint: 'Unit 3 is throwing a high-head alarm. The room is holding, for now.',
    resolution: 'diagnose',
    districts: ['techpark'],
    requiresSectors: ['2.0', '3.0', '4.0', '6.0', '10.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter', 'manometer', 'recovery-machine'],
    requiresRank: 'lead',
    requiresReputation: 88,
    pay: 1400,
    minutes: 210,
    reputation: 14,
    tier: 3,
  },
  {
    id: 'humidity-control',
    sector: 'data-center',
    title: 'Humidity out of band',
    complaint: 'Room dew point is drifting and the monitoring is complaining about it hourly.',
    resolution: 'knowledge',
    districts: ['techpark'],
    requiresSectors: ['7.0', '10.0'],
    requiresTools: ['psychrometer', 'thermocouple', 'manometer'],
    requiresRank: 'lead',
    requiresReputation: 92,
    pay: 1150,
    minutes: 180,
    reputation: 12,
    quizDomain: '7.0',
  },

  // --- controls -------------------------------------------------------------
  {
    id: 'controls-sequence',
    sector: 'controls',
    title: 'Sequence of operation not following',
    complaint: 'The unit is not staging the way the drawings say it should.',
    resolution: 'knowledge',
    districts: ['downtown', 'techpark'],
    requiresSectors: ['5.0', '8.0', '10.0'],
    requiresTools: ['multimeter', 'clamp-meter'],
    requiresRank: 'lead',
    requiresReputation: 62,
    pay: 690,
    minutes: 165,
    reputation: 9,
    quizDomain: '10.0',
  },

  // --- install --------------------------------------------------------------
  {
    id: 'changeout',
    sector: 'install',
    title: 'System changeout',
    complaint: 'Full replacement, condenser and coil. Line set stays.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['3.0', '4.0'],
    requiresTools: ['recovery-machine', 'vacuum-pump', 'micron-gauge', 'nitrogen-kit', 'brazing-kit', 'refrigerant-scale'],
    requiresRank: 'lead',
    requiresReputation: 48,
    pay: 1250,
    minutes: 300,
    reputation: 11,
    quizDomain: '3.0',
  },
  {
    id: 'ductwork-retrofit',
    sector: 'install',
    title: 'Return duct retrofit',
    complaint: 'Static pressure has been strangling this system since it was installed.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['6.0'],
    requiresTools: ['manometer'],
    requiresRank: 'lead',
    requiresReputation: 52,
    pay: 880,
    minutes: 240,
    reputation: 9,
    quizDomain: '6.0',
  },

  // --- mid-career filler ----------------------------------------------------
  // Work that keeps the board from thinning out in the middle of the game,
  // where the residential calls are behind you and the commercial ones are not
  // yet open.
  {
    id: 'capacitor-swap',
    sector: 'residential',
    title: 'Compressor will not start',
    complaint: 'Fan spins but the compressor just grunts. Neighbour said it is probably the capacitor.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['5.0'],
    requiresTools: ['multimeter'],
    requiresRank: 'apprentice',
    requiresReputation: 10,
    pay: 210,
    minutes: 75,
    reputation: 4,
    quizDomain: '5.0',
  },
  {
    id: 'drain-blockage',
    sector: 'residential',
    title: 'Water on the ceiling',
    complaint: 'There is a stain spreading below the air handler and the unit keeps shutting off.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown', 'downtown'],
    requiresSectors: ['1.0', '6.0'],
    requiresTools: [],
    requiresRank: 'apprentice',
    requiresReputation: 6,
    pay: 175,
    minutes: 75,
    reputation: 3,
    quizDomain: '6.0',
  },
  {
    id: 'seasonal-changeover',
    sector: 'residential',
    title: 'Seasonal changeover',
    complaint: 'Twelve units on a property management contract, all needing their autumn service.',
    resolution: 'routine',
    districts: ['suburbs', 'downtown'],
    requiresSectors: ['1.0'],
    requiresTools: ['multimeter'],
    requiresRank: 'apprentice',
    requiresReputation: 14,
    pay: 340,
    minutes: 300,
    reputation: 5,
  },
  {
    id: 'defrost-fault',
    sector: 'residential',
    title: 'Heat pump icing over',
    complaint: 'The outdoor unit is a block of ice and the house is cold.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown'],
    requiresSectors: ['9.0'],
    requiresTools: ['multimeter', 'thermocouple'],
    requiresRank: 'technician',
    requiresReputation: 30,
    pay: 315,
    minutes: 105,
    reputation: 6,
    quizDomain: '9.0',
  },
  {
    id: 'reversing-valve',
    sector: 'residential',
    title: 'Heat pump blows cold on heat',
    complaint: 'It cools beautifully. In heating it blows cold air and the bill is enormous.',
    resolution: 'diagnose',
    districts: ['suburbs'],
    requiresSectors: ['2.0', '4.0', '9.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter'],
    requiresRank: 'technician',
    requiresReputation: 36,
    pay: 395,
    minutes: 120,
    reputation: 7,
    tier: 2,
  },
  {
    id: 'restaurant-makeup-air',
    sector: 'light-commercial',
    title: 'Kitchen pulling the doors shut',
    complaint: 'When the hood runs the front door is hard to open and the pilot lights blow out.',
    resolution: 'knowledge',
    districts: ['downtown'],
    requiresSectors: ['6.0', '8.0'],
    requiresTools: ['manometer'],
    requiresRank: 'technician',
    requiresReputation: 38,
    pay: 480,
    minutes: 135,
    reputation: 7,
    quizDomain: '6.0',
  },
  {
    id: 'boiler-service',
    sector: 'light-commercial',
    title: 'Hydronic boiler, no heat upstairs',
    complaint: 'Ground floor is warm. The second floor has been cold since the system was flushed.',
    resolution: 'knowledge',
    districts: ['downtown', 'oldtown'],
    requiresSectors: ['8.0'],
    requiresTools: ['thermocouple', 'multimeter'],
    requiresRank: 'technician',
    requiresReputation: 34,
    pay: 410,
    minutes: 135,
    reputation: 6,
    quizDomain: '8.0',
  },
  {
    id: 'economiser-check',
    sector: 'light-commercial',
    title: 'Economiser stuck shut',
    complaint: 'Building is running mechanical cooling on a fifty-degree day. Energy audit flagged it.',
    resolution: 'knowledge',
    districts: ['downtown', 'techpark'],
    requiresSectors: ['5.0', '6.0', '10.0'],
    requiresTools: ['multimeter', 'thermocouple'],
    requiresRank: 'lead',
    requiresReputation: 50,
    pay: 640,
    minutes: 150,
    reputation: 8,
    quizDomain: '10.0',
  },
  {
    id: 'display-case',
    sector: 'refrigeration',
    title: 'Display case not holding',
    complaint: 'Open multideck is sitting six degrees warm and the night blinds are down.',
    resolution: 'diagnose',
    districts: ['downtown', 'industrial'],
    requiresSectors: ['2.0', '3.0', '4.0', '10.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'clamp-meter'],
    requiresRank: 'technician',
    requiresReputation: 44,
    pay: 590,
    minutes: 150,
    reputation: 8,
    tier: 2,
  },
  {
    id: 'ice-machine',
    sector: 'refrigeration',
    title: 'Ice machine producing slush',
    complaint: 'Harvest cycle runs but what comes out is soft and cloudy.',
    resolution: 'knowledge',
    districts: ['downtown', 'industrial'],
    requiresSectors: ['2.0', '4.0', '10.0'],
    requiresTools: ['manifold-gauges', 'thermocouple'],
    requiresRank: 'technician',
    requiresReputation: 40,
    pay: 520,
    minutes: 135,
    reputation: 7,
    quizDomain: '10.0',
  },
  {
    id: 'crac-humidifier',
    sector: 'data-center',
    title: 'CRAC fighting itself',
    complaint: 'Two units in the same room, one humidifying and one dehumidifying. Nobody set them up.',
    resolution: 'knowledge',
    districts: ['techpark'],
    requiresSectors: ['7.0', '10.0'],
    requiresTools: ['psychrometer', 'thermocouple', 'multimeter'],
    requiresRank: 'lead',
    requiresReputation: 90,
    pay: 1250,
    minutes: 165,
    reputation: 13,
    quizDomain: '10.0',
  },
  {
    id: 'containment-survey',
    sector: 'data-center',
    title: 'Hot aisle survey',
    complaint: 'Two racks are throttling. They want to know whether it is airflow or capacity.',
    resolution: 'knowledge',
    districts: ['techpark'],
    requiresSectors: ['6.0', '7.0', '10.0'],
    requiresTools: ['manometer', 'psychrometer', 'thermocouple'],
    requiresRank: 'lead',
    requiresReputation: 86,
    pay: 1080,
    minutes: 180,
    reputation: 12,
    quizDomain: '6.0',
  },
  {
    id: 'startup-commissioning',
    sector: 'install',
    title: 'New system start-up',
    complaint: 'Install crew finished yesterday. Somebody has to commission it and sign it off.',
    resolution: 'knowledge',
    districts: ['suburbs', 'downtown'],
    requiresSectors: ['4.0', '6.0'],
    requiresTools: ['manifold-gauges', 'thermocouple', 'manometer', 'refrigerant-scale'],
    requiresRank: 'technician',
    requiresReputation: 42,
    pay: 560,
    minutes: 180,
    reputation: 8,
    quizDomain: '4.0',
  },
  {
    id: 'linesst-braze',
    sector: 'install',
    title: 'Line set replacement',
    complaint: 'Old line set is contaminated after a burnout. It all has to come out.',
    resolution: 'knowledge',
    districts: ['suburbs', 'oldtown', 'downtown'],
    requiresSectors: ['3.0'],
    requiresTools: ['recovery-machine', 'vacuum-pump', 'micron-gauge', 'nitrogen-kit', 'brazing-kit'],
    requiresRank: 'lead',
    requiresReputation: 46,
    pay: 920,
    minutes: 270,
    reputation: 10,
    quizDomain: '3.0',
  },
];

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export interface Availability {
  readonly available: boolean;
  /** Human-readable reasons it is not, most actionable first. */
  readonly blockers: readonly string[];
  readonly missingSectors: readonly string[];
  readonly missingTools: readonly ToolId[];
}

export function jobAvailability(
  template: JobTemplate,
  passedSectors: ReadonlySet<string>,
  ownedTools: readonly ToolId[],
  heldRank: RankId,
  reputation: number,
  sectorTitles: ReadonlyMap<string, string>,
): Availability {
  const missingSectors = template.requiresSectors.filter((s) => !passedSectors.has(s));
  const missingTools = toolsMissingFor(template.requiresTools, ownedTools);
  const blockers: string[] = [];

  if (!meetsRank(template.requiresRank, heldRank)) {
    blockers.push(`Needs ${template.requiresRank} rank`);
  }
  if (reputation < template.requiresReputation) {
    blockers.push(`Needs ${template.requiresReputation} reputation`);
  }
  if (missingSectors.length > 0) {
    const names = missingSectors.map((s) => sectorTitles.get(s) ?? s);
    blockers.push(`Study ${names.join(', ')}`);
  }
  if (missingTools.length > 0) {
    blockers.push(`Buy ${missingTools.length} tool${missingTools.length === 1 ? '' : 's'}`);
  }

  return { available: blockers.length === 0, blockers, missingSectors, missingTools };
}

// ---------------------------------------------------------------------------
// Board generation
// ---------------------------------------------------------------------------

const CLIENTS = [
  'Mrs Alvarez',
  'the Kowalski place',
  'Dunn & Sons',
  'Riverside Diner',
  'Hartley Property Mgmt',
  'the Okafor house',
  'Northline Storage',
  'Bell Street Apartments',
  'Cascade Foods',
  'Meridian Data',
  'Pinewood Dental',
  'the Nguyen residence',
  'Fairmount Church',
  'Delgado Auto',
  'Summit Offices',
];

export interface BoardOptions {
  readonly rng: Rng;
  readonly day: number;
  readonly reputation: number;
  /** Used to retire entry-level work once you have outgrown it. */
  readonly rank?: RankId;
  readonly openDistricts: readonly DistrictId[];
  readonly count?: number;
  /**
   * Whether the player could actually take this job today. Used to guarantee a
   * floor of workable jobs — omit it and the board is drawn purely at random.
   */
  readonly takeable?: (template: JobTemplate) => boolean;
}

/** How much of the board is reserved for work you can actually do. */
const TAKEABLE_SHARE = 0.55;

/**
 * Build a day's board.
 *
 * Two competing requirements, balanced deliberately.
 *
 * There must always be work you can do — a board of seven jobs and no way to
 * earn is not a difficulty curve, it is a dead end, so a little over half the
 * slots are reserved for jobs that pass every gate.
 *
 * The rest are jobs you cannot take yet, and those are the important half.
 * Seeing a walk-in cooler call sitting there marked "Study Refrigerants & EPA
 * 608" is a better reason to open a lesson than any number of XP points,
 * because it is a specific thing you want and a specific reason you cannot
 * have it.
 */
export function generateBoard(options: BoardOptions): Job[] {
  const { rng, day, reputation } = options;
  const heldRank: RankId = options.rank ?? 'student';
  const count = options.count ?? 7;
  const open = new Set(options.openDistricts);

  const candidates = JOB_TEMPLATES.flatMap((template) =>
    template.districts
      .filter((d) => open.has(d))
      // Show work slightly above your standing, but not absurdly so — a
      // student should not be looking at data centre calls.
      .filter(() => reputation + 25 >= template.requiresReputation)
      .filter(() => !template.retiresAt || !meetsRank(template.retiresAt, heldRank))
      .map((d) => ({ template, districtId: d })),
  );

  if (candidates.length === 0) return [];

  const picked: typeof candidates = [];

  if (options.takeable) {
    const canDo = candidates.filter((c) => options.takeable!(c.template));
    const floor = Math.min(Math.ceil(count * TAKEABLE_SHARE), canDo.length);
    picked.push(...rng.sample(canDo, floor));
  }

  // Fill the remainder from everything not already chosen, blocked or not.
  const chosen = new Set(picked.map((p) => `${p.template.id}:${p.districtId}`));
  const rest = candidates.filter((c) => !chosen.has(`${c.template.id}:${c.districtId}`));
  picked.push(...rng.sample(rest, Math.max(0, count - picked.length)));

  return rng.shuffle(picked).map((entry, i) => {
    const variance = 0.85 + rng.int(0, 30) / 100;
    return {
      uid: `${day}.${i}.${entry.template.id}`,
      template: entry.template,
      district: entry.districtId,
      client: rng.pick(CLIENTS),
      pay: Math.round((entry.template.pay * variance) / 5) * 5,
      postedOn: day,
    };
  });
}

/** Total minutes a job costs: travel there and back, plus time on site. */
export function jobMinutes(job: Job): number {
  return district(job.district).travelMinutes * 2 + job.template.minutes;
}
