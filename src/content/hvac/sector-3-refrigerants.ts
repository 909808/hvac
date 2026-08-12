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

// --- more 3.1 ---------------------------------------------------------------

const chlorineOzone = defineQuestion({
  ...T,
  id: 'hvac.3.1.chlorine-ozone',
  objective: '3.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Which element in older refrigerants is responsible for ozone depletion?',
  choices: ['Chlorine', 'Fluorine', 'Carbon', 'Hydrogen'],
  answer: 0,
  explain:
    'Chlorine is the ozone-destroying element, and the phase-out order follows how much of it each ' +
    'family contains.\n\n' +
    'CFCs have the most and went first. HCFCs — the H is hydrogen, which makes them break down ' +
    'lower in the atmosphere — have less and were phased out of new equipment by 2010. HFCs have ' +
    'none at all.\n\n' +
    'HFCs are not environmentally free, though: many have high global warming potential, which is ' +
    'what is driving the current move to lower-GWP alternatives.',
  source: cite.todo('Confirm the ozone depletion discussion against your EPA 608 material.'),
  status: 'draft',
});

const r410aPressure = defineQuestion({
  ...T,
  id: 'hvac.3.1.r410a-pressure',
  objective: '3.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why can R-410A not simply be put into a system designed for R-22?',
  choices: [
    'R-410A runs at roughly 60% higher pressure and needs components rated for it, plus different oil',
    'R-410A is chemically incompatible with copper',
    'R-410A requires a larger metering device only',
    'It can be, provided the charge is reduced',
  ],
  answer: 0,
  explain:
    'R-410A operates at substantially higher pressures — around 118 psig at 40°F where R-22 is ' +
    '68.5 psig, and over 400 psig on the high side on a hot day. Components, service valves and ' +
    'even gauges have to be rated for it.\n\n' +
    'It also uses POE oil rather than mineral oil, and the two do not mix well. Residual mineral ' +
    'oil in an old system will not return properly with R-410A.\n\n' +
    'The general principle: retrofitting refrigerants is a manufacturer-specified procedure, not ' +
    'something to improvise.',
  source: cite.todo('Confirm retrofit guidance against your text and manufacturer literature.'),
  status: 'draft',
});

// --- more 3.2 ---------------------------------------------------------------

const acidFormation = defineQuestion({
  ...T,
  id: 'hvac.3.2.acid-formation',
  objective: '3.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A compressor fails eighteen months after a repair. The oil tests acidic.\n\n' +
    'What most likely happened at the time of the repair?',
  choices: [
    'Moisture was left in the system because it was not properly evacuated',
    'The wrong refrigerant was used',
    'The compressor was undersized',
    'The system was overcharged',
  ],
  answer: 0,
  explain:
    'Water plus POE oil produces acid. Acid attacks motor windings and bearing surfaces, and the ' +
    'failure comes months or years later — long enough that the connection to the original repair ' +
    'is usually never made.\n\n' +
    'The sequence is: system opened, moisture gets in, evacuation done by the clock rather than to ' +
    '500 microns with a decay test, water sealed inside, acid forms slowly, compressor dies.\n\n' +
    'This is why the evacuation procedure is not bureaucracy. It is the difference between a ' +
    'repair that lasts and one that quietly destroys the most expensive component in the system.',
  source: cite.todo('Confirm the acid formation discussion against your text.'),
  status: 'draft',
});

const filterDrierPurpose = defineQuestion({
  ...T,
  id: 'hvac.3.2.filter-drier',
  objective: '3.2',
  kind: 'multi',
  difficulty: 2,
  prompt: 'What does a filter drier do? Select all that apply.',
  choices: [
    'Adsorbs moisture from the refrigerant',
    'Traps particulate contamination',
    'Adsorbs acid formed in the system',
    'Adds refrigerant to the system',
  ],
  answers: [0, 1, 2],
  explain:
    'All three of the first ones. The desiccant core holds moisture and acid; the filter media ' +
    'catches particles that would otherwise plug the metering device.\n\n' +
    'A drier has finite capacity, which is why it is replaced whenever the system is opened. A ' +
    'saturated drier stops protecting and can itself become a restriction — which is one of the ' +
    'more common causes of the high-superheat-with-high-subcooling signature.\n\n' +
    'Note the direction arrow on the body. Fitting one backwards is easy and defeats the purpose.',
  source: cite.todo('Confirm the filter drier discussion against your text.'),
  status: 'draft',
});

// --- more 3.3 / 3.4 ---------------------------------------------------------

const sameOwnerRule = defineQuestion({
  ...T,
  id: 'hvac.3.3.same-owner',
  objective: '3.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You recover refrigerant from one customer\'s system. Another customer needs a charge.\n\n' +
    'Can you put the recovered refrigerant into the second system?',
  choices: [
    'Not without reclaiming it to ARI-700 specification at a certified reclaimer first',
    'Yes, provided it is the same refrigerant type',
    'Yes, provided you run it through a recovery machine filter',
    'Yes, there is no restriction on recovered refrigerant',
  ],
  answer: 0,
  explain:
    'Recovered refrigerant may go back into the **same system**, or into one owned by the **same ' +
    'person**. Moving it to a different owner requires reclamation to virgin specification, ' +
    'verified by chemical analysis at a licensed facility.\n\n' +
    'Field recycling — oil separation and filter-drying through a recovery machine — is not ' +
    'sufficient for that. The distinction is legal, not a matter of how clean you think it is.',
  source: cite.standard('40 CFR Part 82, Subpart F'),
  status: 'verified',
});

const cylinderWeight = defineQuestion({
  ...T,
  id: 'hvac.3.4.cylinder-by-weight',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why must recovery cylinder fill level be determined by weight rather than by pressure?',
  choices: [
    'Pressure only reflects temperature while any liquid remains, so it says nothing about how full the cylinder is',
    'Pressure gauges are not accurate enough',
    'Weight is required by DOT but pressure would work',
    'Pressure readings vary with the refrigerant type',
  ],
  answer: 0,
  explain:
    'While liquid and vapour coexist in the cylinder, the pressure is simply the saturation ' +
    'pressure at that temperature. A cylinder 10% full and one 79% full read exactly the same at ' +
    'the same temperature.\n\n' +
    'Pressure only starts rising sharply once the cylinder is liquid-full — at which point you are ' +
    'already past the danger point. By then the reading is warning you far too late.\n\n' +
    'Put it on a scale. Know the tare weight, know the 80% limit, and watch the number.',
  source: cite.standard('40 CFR Part 82, Subpart F; DOT cylinder requirements'),
  status: 'verified',
});

const mixedCylinder = defineQuestion({
  ...T,
  id: 'hvac.3.4.never-mix',
  objective: '3.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A recovery cylinder has R-22 in it. You are about to recover R-410A from another job.\n\n' +
    'What must you do?',
  choices: [
    'Use a different cylinder — mixed refrigerant cannot be reclaimed and becomes disposal',
    'Top it up; the reclaimer will separate them',
    'Recover into it but label the cylinder as mixed',
    'Vent the R-22 first, then recover the R-410A',
  ],
  answer: 0,
  whyWrong: {
    1: 'Reclaimers cannot economically separate mixed refrigerants and will reject the cylinder.',
    2: 'Labelling does not make it reclaimable — it just documents that it is waste.',
    3: 'Venting is illegal.',
  },
  explain:
    'Mixed refrigerant cannot be reclaimed. The cylinder becomes hazardous waste, which you pay to ' +
    'dispose of, and you lose the value of both refrigerants.\n\n' +
    'Keep a dedicated cylinder per refrigerant, labelled clearly. It is a small amount of ' +
    'organisation that avoids an expensive and entirely self-inflicted problem.',
  source: cite.todo('Confirm cylinder handling practice against your text and EPA 608 material.'),
  status: 'draft',
});

// --- more 3.5 / 3.6 ---------------------------------------------------------

const leakSearchOrder = defineQuestion({
  ...T,
  id: 'hvac.3.5.find-the-leak',
  objective: '3.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A system is low on charge. What is the correct response?',
  choices: [
    'Find and repair the leak, then evacuate and weigh in a full charge',
    'Add refrigerant to bring it back to spec and note it for next season',
    'Add refrigerant and a leak-sealing additive',
    'Recover the remaining charge and replace the compressor',
  ],
  answer: 0,
  explain:
    'Refrigerant is not consumed — it runs in a sealed loop. If a system is low, it leaked, and ' +
    'adding more without finding the leak means the customer pays again next season.\n\n' +
    'Repeatedly topping up a leaking system is also a regulatory problem for larger equipment, ' +
    'which has leak-rate thresholds and repair requirements.\n\n' +
    'Leak sealants are controversial at best: they can plug metering devices and contaminate ' +
    'recovery equipment. Most manufacturers void warranty coverage over them.',
  source: cite.todo('Confirm leak repair guidance against your text and the leak repair provisions of 40 CFR Part 82.'),
  status: 'draft',
});

const coreRequirement = defineQuestion({
  ...T,
  id: 'hvac.3.6.core-section',
  objective: '3.6',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What does passing only the Core section of the EPA 608 exam certify you to do?',
  choices: [
    'Nothing on its own — Core is a prerequisite that must be paired with a type section',
    'Work on small appliances',
    'Purchase refrigerant but not service equipment',
    'Work on any equipment under supervision',
  ],
  answer: 0,
  explain:
    'Core covers the science, regulations and safety common to all types, and every candidate must ' +
    'pass it. But it certifies you for no equipment by itself.\n\n' +
    'You need Core **plus** at least one type: Type I for small appliances, Type II for high ' +
    'pressure (most residential and light commercial), Type III for low pressure. Pass all three ' +
    'type sections and you hold Universal.\n\n' +
    'Certification does not expire.',
  source: cite.standard('40 CFR §82.161'),
  status: 'verified',
});

export const SECTOR_3_QUESTIONS: readonly Question[] = [
  refrigerantFamilies,
  chlorineOzone,
  r410aPressure,
  blendGlide,
  oilCompatibility,
  acidFormation,
  filterDrierPurpose,
  threeRs,
  sameOwnerRule,
  evacuationLevels,
  cylinderFill,
  cylinderWeight,
  mixedCylinder,
  leakDetection,
  leakSearchOrder,
  nitrogenPurge,
  certificationTypes,
  coreRequirement,
  salesRestriction,
];
