import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Sector 3 — Refrigerants & EPA 608.
 *
 * The regulatory content is genuinely legal rather than technical, and it
 * changes. Anything cited to 40 CFR Part 82 below is checkable against the
 * current rule; anything marked draft should be confirmed against current EPA
 * 608 preparation material before you rely on it for the exam.
 */

const T = { track: 'hvac', domain: '3.0' } as const;

// --- 3.1 Families and numbering ---------------------------------------------

const refrigerantFamilies = defineQuestion({
  ...T,
  id: 'hvac.3.1.families',
  objective: '3.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each refrigerant to its family.',
  pairs: [
    ['R-12', 'CFC — chlorofluorocarbon, fully phased out'],
    ['R-22', 'HCFC — hydrochlorofluorocarbon, phased out of new equipment'],
    ['R-410A', 'HFC blend — no chlorine, so no ozone depletion'],
    ['R-134a', 'HFC — single compound, no chlorine'],
    ['R-717', 'Ammonia — an inorganic refrigerant used in industrial plant'],
  ],
  explain:
    'Chlorine is the ozone-depleting element, which is what drove the phase-outs: CFCs first ' +
    '(most chlorine), then HCFCs. HFCs have no chlorine and no ozone impact, but many have high ' +
    'global warming potential, which is what is now driving the move to lower-GWP alternatives ' +
    'and HFO blends.\n\n' +
    'The 700 series is the inorganics, numbered by molecular weight — ammonia is 17, so R-717.',
  source: cite.todo('Confirm the family assignments against current EPA 608 preparation material.'),
  status: 'draft',
});

const blendGlide = defineQuestion({
  ...T,
  id: 'hvac.3.1.blend-charging',
  objective: '3.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why must a zeotropic or near-azeotropic blend such as R-410A be charged as a liquid rather ' +
    'than as a vapour?',
  choices: [
    'The components evaporate at different rates, so vapour charging would change the blend proportions',
    'Liquid charging is faster',
    'Vapour charging would damage the gauges',
    'The blend would freeze if charged as a vapour',
  ],
  answer: 0,
  explain:
    'A blend is a mixture of components with different boiling points. Draw vapour off the top of ' +
    'a cylinder and the more volatile component leaves preferentially, so what goes into the ' +
    'system is no longer the blend on the label — and what remains in the cylinder is not either.\n\n' +
    'Charging liquid takes the whole mixture in its correct proportions. To avoid slugging the ' +
    'compressor, meter that liquid into the suction line slowly through a restrictor, or charge ' +
    'into the high side with the system off.\n\n' +
    'The same logic means a leaking blend system should be recovered and recharged rather than ' +
    'topped up: the composition of what leaked out may not match the label.',
  source: cite.todo('Confirm the blend charging procedure against your text or EPA 608 material.'),
  status: 'draft',
});

// --- 3.2 Oils ---------------------------------------------------------------

const oilCompatibility = defineQuestion({
  ...T,
  id: 'hvac.3.2.oil-types',
  objective: '3.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which oil is used with R-410A, and what is the practical consequence?',
  choices: [
    'POE, which is strongly hygroscopic — it absorbs moisture rapidly from the air',
    'Mineral oil, which must be kept warm to stay fluid',
    'Alkylbenzene, which requires no special handling',
    'Any oil, since modern refrigerants are compatible with all of them',
  ],
  answer: 0,
  explain:
    'R-410A and other HFCs use POE (polyolester) oil, because mineral oil will not return through ' +
    'the system with them.\n\n' +
    'The handling consequence is significant: POE pulls moisture out of the air fast, and it does ' +
    'not give it back easily. An open container of POE, or a system left open to atmosphere, ' +
    'takes on water that a normal evacuation struggles to remove. Water plus POE produces acid, ' +
    'and acid takes out compressors.\n\n' +
    'Practically: cap lines immediately, keep POE containers sealed, purge with nitrogen while ' +
    'brazing, and evacuate to 500 microns with a decay test rather than by the clock.',
  source: cite.todo('Confirm oil compatibility against your text.'),
  status: 'draft',
});

// --- 3.3 Recovery, recycling, reclamation ------------------------------------

const threeRs = defineQuestion({
  ...T,
  id: 'hvac.3.3.recover-recycle-reclaim',
  objective: '3.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each term to its definition under the EPA rules.',
  pairs: [
    ['Recover', 'Remove refrigerant from a system and store it in a container, with no processing'],
    ['Recycle', 'Clean refrigerant in the field with oil separation and filter-drying'],
    ['Reclaim', 'Reprocess to virgin specification and verify by chemical analysis at a licensed facility'],
  ],
  explain:
    'The three are a ladder of how thoroughly the refrigerant is cleaned, and the distinction has ' +
    'legal weight rather than being a matter of vocabulary.\n\n' +
    'Recovered refrigerant may go back into the same system or one owned by the same person. ' +
    'Refrigerant sold to a different owner must be reclaimed to the ARI-700 purity standard by a ' +
    'certified reclaimer — recycling in the field is not sufficient for that.',
  source: cite.standard('40 CFR Part 82, Subpart F'),
  status: 'verified',
});

const evacuationLevels = defineQuestion({
  ...T,
  id: 'hvac.3.3.recovery-before-opening',
  objective: '3.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Before opening a small appliance or an air conditioning system for repair, what does the ' +
    'EPA require?',
  choices: [
    'Recover the refrigerant to the required evacuation level for that equipment type',
    'Vent the refrigerant slowly to reduce environmental impact',
    'Nothing, provided the charge is under 5 pounds',
    'Recover only if the refrigerant is a CFC or HCFC',
  ],
  answer: 0,
  whyWrong: {
    1: 'Knowingly venting is prohibited regardless of how slowly it is done.',
    2: 'The prohibition applies regardless of charge size.',
    3: 'The venting prohibition was extended to substitutes including HFCs.',
  },
  explain:
    'Knowingly venting refrigerant during maintenance, service, repair or disposal is prohibited. ' +
    'The required recovery level depends on the equipment type and size, and on whether the ' +
    'recovery equipment was manufactured before or after November 1993.\n\n' +
    'There are narrow exceptions — de minimis releases while connecting and disconnecting gauges, ' +
    'and purging of non-condensables that contain only trace refrigerant. Those are exceptions ' +
    'about unavoidable small losses, not permission to release a charge.',
  source: cite.standard('40 CFR §82.154 (prohibitions) and §82.156 (required practices)'),
  status: 'verified',
});

// --- 3.4 Cylinders ----------------------------------------------------------

const cylinderFill = defineQuestion({
  ...T,
  id: 'hvac.3.4.cylinder-fill-limit',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'To what level may a recovery cylinder be filled, and why?',
  choices: [
    '80% of capacity by weight, to leave room for the liquid to expand if it warms',
    '100%, since the cylinder is rated for the pressure',
    '50%, to keep the cylinder light enough to carry',
    '95%, measured by pressure rather than weight',
  ],
  answer: 0,
  whyWrong: {
    1: 'A liquid-full cylinder has nowhere to expand and can rupture from hydrostatic pressure alone.',
    2: '50% is unnecessarily conservative and is not the rule.',
    3: 'Fill level must be determined by weight on a scale, not by pressure.',
  },
  explain:
    'The 80% limit exists because liquids are nearly incompressible. A cylinder filled solid with ' +
    'liquid that then warms in a van has no vapour space to absorb the expansion, and the ' +
    'pressure rises catastrophically — far past the relief setting, fast.\n\n' +
    'Fill by weight on a scale. A pressure gauge cannot tell you how full a cylinder is, because ' +
    'the pressure only reflects temperature as long as any liquid remains.\n\n' +
    'Also: never refill a disposable cylinder, and never mix refrigerants in a recovery cylinder — ' +
    'a mixed cylinder cannot be reclaimed and becomes disposal.',
  source: cite.standard('40 CFR Part 82, Subpart F; DOT cylinder requirements'),
  status: 'verified',
});

// --- 3.5 Leak detection and evacuation ---------------------------------------

const leakDetection = defineQuestion({
  ...T,
  id: 'hvac.3.5.pressure-test-gas',
  objective: '3.5',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What should be used to pressure-test a system for leaks, and what must never be used?',
  choices: [
    'Dry nitrogen with a regulator; never oxygen, and never compressed air with refrigerant present',
    'Oxygen, because it is readily available on most job sites',
    'Compressed air, because it is free',
    'The system refrigerant itself, pressurised with the compressor',
  ],
  answer: 0,
  explain:
    'Dry nitrogen is inert, dry, and cheap. Always through a regulator — cylinder pressure is ' +
    'thousands of psi and will burst a system component instantly.\n\n' +
    'Oxygen is the dangerous mistake. Oxygen under pressure in contact with oil produces violent ' +
    'combustion. Never put oxygen in a refrigeration system for any reason.\n\n' +
    'Compressed air brings moisture with it, and if refrigerant is present it can form a ' +
    'combustible mixture under pressure. Using refrigerant as a trace gas at pressure is also a ' +
    'venting problem — a small nitrogen-with-trace-refrigerant charge is the accepted approach ' +
    'where an electronic detector needs something to find.',
  source: cite.todo('Confirm pressure-testing practice against your text and the equipment manufacturer.'),
  status: 'draft',
});

const nitrogenPurge = defineQuestion({
  ...T,
  id: 'hvac.3.5.nitrogen-while-brazing',
  objective: '3.5',
  kind: 'choice',
  difficulty: 3,
  prompt: 'Why flow a low-pressure nitrogen purge through the tubing while brazing?',
  choices: [
    'To displace oxygen and prevent copper oxide scale forming inside the tubing',
    'To cool the joint so the braze sets faster',
    'To pressure-test the joint at the same time',
    'To keep the refrigerant from escaping',
  ],
  answer: 0,
  explain:
    'Heating copper in the presence of oxygen produces a black flaky oxide on the inside surface. ' +
    'That scale breaks loose once the system runs and travels with the refrigerant, where it ' +
    'plugs metering devices and driers and contaminates the compressor.\n\n' +
    'A gentle nitrogen flow — a few CFH, just enough to displace air, not enough to blow the ' +
    'molten braze out — leaves the inside of the joint bright. You only get one chance at this; ' +
    'scale cannot be cleaned out afterwards.\n\n' +
    'There should be no refrigerant in the system at all while brazing. Heating refrigerant ' +
    'produces toxic decomposition products.',
  source: cite.todo('Confirm brazing practice against your text.'),
  status: 'draft',
});

// --- 3.6 Certification -------------------------------------------------------

const certificationTypes = defineQuestion({
  ...T,
  id: 'hvac.3.6.608-types',
  objective: '3.6',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each EPA Section 608 certification type to what it covers.',
  pairs: [
    ['Type I', 'Small appliances — factory-charged with 5 lb or less'],
    ['Type II', 'High-pressure and very high-pressure appliances'],
    ['Type III', 'Low-pressure appliances, such as centrifugal chillers'],
    ['Universal', 'All three types, by passing all three sections'],
  ],
  explain:
    'Every candidate must also pass a Core section covering the science, regulations and safety ' +
    'common to all of them. The Core alone does not certify you for anything — it is a ' +
    'prerequisite for the type sections.\n\n' +
    'Most residential and light commercial work is Type II. Certification does not expire.',
  source: cite.standard('40 CFR §82.161 (technician certification)'),
  status: 'verified',
});

const salesRestriction = defineQuestion({
  ...T,
  id: 'hvac.3.6.who-must-be-certified',
  objective: '3.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Who is required to hold Section 608 certification?',
  choices: [
    'Anyone who maintains, services, repairs or disposes of equipment that could release refrigerant',
    'Only technicians who own their own recovery equipment',
    'Only technicians working on commercial equipment',
    'Only technicians handling CFC and HCFC refrigerants',
  ],
  answer: 0,
  explain:
    'The requirement follows the activity, not the job title or the refrigerant. Anyone opening a ' +
    'system in a way that could release refrigerant needs the appropriate certification.\n\n' +
    'It also gates purchasing: refrigerant sales are restricted to certified technicians. ' +
    'Certification does not expire, and you are required to keep proof of it available.',
  source: cite.standard('40 CFR §82.161; §82.164 (refrigerant sales restriction)'),
  status: 'verified',
});

export const SECTOR_3_QUESTIONS: readonly Question[] = [
  refrigerantFamilies,
  blendGlide,
  oilCompatibility,
  threeRs,
  evacuationLevels,
  cylinderFill,
  leakDetection,
  nitrogenPurge,
  certificationTypes,
  salesRestriction,
];
