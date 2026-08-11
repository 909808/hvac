import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 8 — Heating: Furnaces & Boilers. */

const T = { track: 'hvac', domain: '8.0' } as const;

// --- 8.1 Combustion --------------------------------------------------------------

const combustionRequirements = defineQuestion({
  ...T,
  id: 'hvac.8.1.combustion-triangle',
  objective: '8.1',
  kind: 'multi',
  difficulty: 1,
  prompt: 'What three things must be present for combustion? Select all that apply.',
  choices: ['Fuel', 'Oxygen', 'An ignition source or sufficient heat', 'Moisture'],
  answers: [0, 1, 2],
  explain:
    'Fuel, oxygen and heat. Remove any one and combustion stops, which is the basis of every ' +
    'safety control on a fired appliance — a gas valve removes fuel, a blocked-vent switch removes ' +
    'the conditions for safe operation, and a flame sensor confirms the heat is actually there.\n\n' +
    'Complete combustion of natural gas produces carbon dioxide and water vapour. Incomplete ' +
    'combustion — usually from insufficient air — produces carbon monoxide, which is what makes ' +
    'combustion air a life-safety issue rather than an efficiency one.',
  source: cite.todo('Confirm against the combustion chapter of your text.'),
  status: 'draft',
});

const naturalGasProperties = defineQuestion({
  ...T,
  id: 'hvac.8.1.gas-properties',
  objective: '8.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Roughly what is the heating value of natural gas, and what manifold pressure does a typical ' +
    'residential furnace run?',
  choices: [
    'About 1,000 BTU per cubic foot, at about 3.5 in. w.c. manifold pressure',
    'About 2,500 BTU per cubic foot, at about 11 in. w.c.',
    'About 100 BTU per cubic foot, at about 3.5 in. w.c.',
    'About 1,000 BTU per cubic foot, at about 0.5 in. w.c.',
  ],
  answer: 0,
  explain:
    'Natural gas runs around 1,000 BTU/ft³, with manifold pressure typically set near 3.5 in. w.c. ' +
    'Propane is roughly 2,500 BTU/ft³ and runs about 11 in. w.c. — which is why the two are not ' +
    'interchangeable without an orifice and pressure conversion.\n\n' +
    'The 1,000 BTU/ft³ figure is what makes clocking the meter possible: time how long the meter ' +
    'takes to pass a known volume and you have the actual firing rate, which is the honest check ' +
    'on whether a furnace is running at nameplate input.\n\n' +
    'Always verify the local heating value with the gas utility — it varies by supply.',
  source: cite.todo('Confirm gas properties and manifold pressures against your text and the equipment data plate.'),
  status: 'draft',
});

// --- 8.2 Sequence of operation ------------------------------------------------------

const furnaceSequence = defineQuestion({
  ...T,
  id: 'hvac.8.2.sequence',
  objective: '8.2',
  kind: 'order',
  difficulty: 3,
  prompt: 'Put the sequence of operation for a modern induced-draft gas furnace in order.',
  steps: [
    'Thermostat closes on a call for heat',
    'Inducer motor starts and purges the heat exchanger',
    'Pressure switch proves inducer airflow and closes',
    'Igniter energises and reaches ignition temperature',
    'Gas valve opens and the burners light',
    'Flame sensor proves flame within the trial-for-ignition period',
    'Blower starts after the fan-on delay',
    'On satisfying the thermostat, the gas valve closes and the blower runs out its off delay',
  ],
  explain:
    'The order is dictated by safety at every step. The inducer runs first and proves itself ' +
    'through the pressure switch, so gas is never introduced without a proven path for the flue ' +
    'gases. The igniter is hot before the valve opens, so gas never accumulates unlit.\n\n' +
    'The flame sensor is the last proof and the most commonly failed component in the chain: a ' +
    'furnace that lights and then shuts down after a few seconds, repeatedly, is almost always a ' +
    'dirty flame sensor or a grounding problem in the sensing circuit.\n\n' +
    'The blower delays exist for comfort and efficiency — on-delay stops it blowing cold air, ' +
    'off-delay scavenges the remaining heat from the exchanger.',
  source: cite.todo('Confirm the sequence against the equipment manufacturer literature.'),
  status: 'draft',
});

const shortCycleLockout = defineQuestion({
  ...T,
  id: 'hvac.8.2.three-tries-lockout',
  objective: '8.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A furnace lights, runs about five seconds, shuts off, retries twice more, then locks out.\n\n' +
    'What does this pattern point to?',
  choices: [
    'Flame is not being proved — a dirty or failed flame sensor, or a grounding problem',
    'The thermostat is set too low',
    'The blower motor has failed',
    'The gas supply pressure is too high',
  ],
  answer: 0,
  explain:
    'The furnace is lighting successfully, so gas, ignition and the inducer chain are all working. ' +
    'What is failing is the proof: the board does not see flame, so it closes the gas valve and ' +
    'retries. After the programmed number of attempts it locks out.\n\n' +
    'Flame rectification works by passing a tiny DC current — microamps — from the sensor through ' +
    'the flame to the grounded burner. Oxide film on the sensor blocks it, as does a poor burner ' +
    'ground. Cleaning the sensor with fine abrasive and confirming the burner ground is the usual ' +
    'fix; a microamp reading tells you definitively.\n\n' +
    'This "lights then drops out" pattern is one of the most recognisable in the trade, and it ' +
    'rules out most of the sequence in a single observation.',
  source: cite.todo('Confirm the flame proving discussion and microamp values against your text.'),
  status: 'draft',
});

// --- 8.3 Ignition ------------------------------------------------------------------

const ignitionTypes = defineQuestion({
  ...T,
  id: 'hvac.8.3.ignition-types',
  objective: '8.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each ignition system to how it works.',
  pairs: [
    ['Standing pilot', 'A continuously burning pilot flame, proved by a thermocouple'],
    ['Intermittent pilot', 'A pilot lit by spark on each call, then proved before the main valve opens'],
    ['Hot surface ignition', 'A silicon carbide or nitride element glowing hot enough to light gas directly'],
    ['Direct spark ignition', 'A spark igniting the main burner with no pilot at all'],
  ],
  explain:
    'The progression is toward eliminating the standing pilot, which burns fuel continuously for ' +
    'no benefit for most of the year.\n\n' +
    'A thermocouple on a standing pilot generates a small DC voltage — around 25 to 30 millivolts ' +
    'in the flame — and that voltage is what holds the safety valve open. No flame, no millivolts, ' +
    'valve closes. It is elegantly self-proving and needs no external power.\n\n' +
    'Hot surface igniters are fragile. Handle them by the ceramic base only: skin oils on the ' +
    'element cause hot spots that crack it.',
  source: cite.todo('Confirm the ignition types and thermocouple values against your text.'),
  status: 'draft',
});

// --- 8.4 Efficiency ----------------------------------------------------------------

const condensingFurnace = defineQuestion({
  ...T,
  id: 'hvac.8.4.condensing',
  objective: '8.4',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What makes a condensing furnace more efficient than a conventional one?',
  choices: [
    'A second heat exchanger cools the flue gas below its dew point, recovering the latent heat in the water vapour',
    'It burns the gas twice',
    'It runs at a higher manifold pressure',
    'It has no flue, so no heat escapes',
  ],
  answer: 0,
  explain:
    'Burning natural gas produces water vapour, and that vapour carries a large amount of latent ' +
    'heat. A conventional furnace sends it up the flue still as vapour, and the heat goes with it.\n\n' +
    'A condensing furnace adds a secondary heat exchanger that drops the flue gas below its dew ' +
    'point. The vapour condenses, releasing its latent heat into the airstream — which is what ' +
    'takes AFUE past 90%.\n\n' +
    'The consequences are practical: the condensate is mildly acidic, so the secondary exchanger ' +
    'is stainless or aluminium and the drain must be handled properly, often neutralised. Flue ' +
    'gas is cool enough to vent through PVC, and it must be — it will not rise up a masonry ' +
    'chimney. A blocked condensate drain is one of the most common no-heat calls on these ' +
    'furnaces, because the pressure switch senses the backed-up water and refuses to run.',
  source: cite.todo('Confirm condensing furnace operation against your text.'),
  status: 'draft',
});

// --- 8.5 Venting -------------------------------------------------------------------

const ventCategories = defineQuestion({
  ...T,
  id: 'hvac.8.5.categories',
  objective: '8.5',
  kind: 'match',
  difficulty: 3,
  prompt: 'Match each vent category to its characteristics.',
  pairs: [
    ['Category I', 'Negative vent pressure, non-condensing — natural draft and most induced draft'],
    ['Category II', 'Negative vent pressure, condensing'],
    ['Category III', 'Positive vent pressure, non-condensing'],
    ['Category IV', 'Positive vent pressure, condensing — high-efficiency furnaces vented in PVC'],
  ],
  explain:
    'Two variables: whether the vent runs above or below atmospheric pressure, and whether the ' +
    'flue gas condenses. The four combinations give the four categories.\n\n' +
    'The distinction is not academic. A Category I appliance relies on buoyancy and needs a vent ' +
    'that will draft; a Category IV appliance is pushed by its inducer and its vent must be sealed ' +
    'against leaks, because it is under positive pressure inside a living space.\n\n' +
    'Venting a furnace to the wrong category — most often putting a high-efficiency furnace into ' +
    'an existing masonry chimney — puts flue gas where people breathe. Always vent to the ' +
    'manufacturer\'s instructions and the applicable code.',
  source: cite.todo('Confirm the vent categories against your text and the applicable fuel gas code.'),
  status: 'draft',
});

const backdrafting = defineQuestion({
  ...T,
  id: 'hvac.8.5.combustion-air',
  objective: '8.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A natural-draft water heater in a small mechanical closet backdrafts whenever the clothes ' +
    'dryer and kitchen exhaust run.\n\nWhat is happening?',
  choices: [
    'The exhaust appliances depressurise the space, and the flue becomes the easiest path for makeup air',
    'The water heater thermostat is set too high',
    'The flue is too large in diameter',
    'The gas pressure is too low',
  ],
  answer: 0,
  explain:
    'Exhaust fans remove air from the house, and that air has to be replaced from somewhere. In a ' +
    'tight house with a sealed closet, the path of least resistance can be back down the water ' +
    'heater flue — reversing the draft and spilling combustion products, including carbon ' +
    'monoxide, into the space.\n\n' +
    'This is why combustion air openings are sized and required, and why a natural-draft appliance ' +
    'in a confined space needs deliberate provision for air. The test is a worst-case ' +
    'depressurisation check: run every exhaust appliance and confirm the flue still drafts.\n\n' +
    'The modern answer is usually a sealed-combustion appliance that draws its air directly from ' +
    'outdoors and is immune to what the house is doing.',
  source: cite.todo('Confirm combustion air requirements against your text and the applicable fuel gas code.'),
  status: 'draft',
});

// --- 8.6 Hydronics -----------------------------------------------------------------

const hydronicComponents = defineQuestion({
  ...T,
  id: 'hvac.8.6.components',
  objective: '8.6',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each hydronic component to its purpose.',
  pairs: [
    ['Expansion tank', 'Absorbs the volume change as water heats, holding system pressure stable'],
    ['Circulator pump', 'Moves water around the loop'],
    ['Air separator', 'Removes entrained air, which would otherwise block flow and corrode'],
    ['Zone valve', 'Directs flow to one part of the building on a call from that zone'],
    ['Aquastat', 'Controls boiler water temperature and its operating limits'],
  ],
  explain:
    'Water is nearly incompressible, so without an expansion tank the pressure rise on heating ' +
    'would lift the relief valve every cycle. A waterlogged expansion tank is a very common cause ' +
    'of a relief valve that keeps discharging.\n\n' +
    'Air is the other recurring problem. It collects at high points, blocks circulation, and ' +
    'accelerates corrosion — which is why separators and air vents exist and why a proper purge ' +
    'after any work matters.',
  source: cite.todo('Confirm the hydronic component list against your text.'),
  status: 'draft',
});

// --- 8.7 Electric heat --------------------------------------------------------------

const electricHeatSequencer = defineQuestion({
  ...T,
  id: 'hvac.8.7.sequencer-purpose',
  objective: '8.7',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why are electric heat strips brought on in stages by a sequencer rather than all at once?',
  choices: [
    'To limit inrush current and the resulting voltage drop and load on the supply',
    'To make the heat last longer',
    'Because the strips would burn out if energised together',
    'To let the blower start first',
  ],
  answer: 0,
  explain:
    'Electric resistance heat draws serious current — a 20 kW bank at 240 V is over 80 A. Bringing ' +
    'that on in one step causes a sharp voltage dip that affects the whole building and stresses ' +
    'contactors and the supply.\n\n' +
    'A sequencer staggers the stages a few seconds apart so the load ramps. The same device also ' +
    'usually keeps the blower running until the strips have cooled, which is a genuine safety ' +
    'function: energised strips with no airflow will overheat and trip their limits, or worse.\n\n' +
    'Electric heat is 100% efficient at the appliance, which sounds impressive but simply means ' +
    'all the electricity becomes heat. A heat pump moves two to four times as much heat per unit ' +
    'of electricity, which is why strips are a supplement rather than a primary heat source where ' +
    'a heat pump is available.',
  source: cite.todo('Confirm the sequencer discussion against your text.'),
  status: 'draft',
});

export const SECTOR_8_QUESTIONS: readonly Question[] = [
  combustionRequirements,
  naturalGasProperties,
  furnaceSequence,
  shortCycleLockout,
  ignitionTypes,
  condensingFurnace,
  ventCategories,
  backdrafting,
  hydronicComponents,
  electricHeatSequencer,
];
