import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/** Sector 8 — Heating: Furnaces & Boilers. */

const T = { track: 'hvac', domain: '8.0' } as const;

/**
 * The furnace safety chain. Each stage must prove itself before the next is
 * allowed, which is what makes "where did it stop?" such a fast diagnosis.
 *
 * Deliberately duplicated from the sector 8 lesson rather than shared: the
 * lesson version may gain annotations that would be wrong on a question, and a
 * diagram is cheap.
 */
const furnaceChain: Topology = {
  caption: 'Each stage proves itself before the next is allowed to run',
  nodes: [
    { id: 'tstat', kind: 'thermostat', label: 'W call', col: 0, row: 1 },
    { id: 'ind', kind: 'fan', label: 'Inducer', sublabel: 'purge', col: 1, row: 1 },
    { id: 'ps', kind: 'sensor', label: 'Pressure sw.', sublabel: 'proves draft', col: 2, row: 1 },
    { id: 'ign', kind: 'controller', label: 'Igniter', sublabel: 'heats up', col: 3, row: 1 },
    { id: 'gas', kind: 'metering', label: 'Gas valve', sublabel: 'opens', col: 4, row: 1 },
    { id: 'flame', kind: 'sensor', label: 'Flame sensor', sublabel: 'proves flame', col: 5, row: 1 },
  ],
  links: [
    { from: 'tstat', to: 'ind' },
    { from: 'ind', to: 'ps' },
    { from: 'ps', to: 'ign' },
    { from: 'ign', to: 'gas' },
    { from: 'gas', to: 'flame' },
  ],
};

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

// --- hotspot on the furnace chain -------------------------------------------

const findFlameProof = defineQuestion({
  ...T,
  id: 'hvac.8.2.hotspot-flame-proving',
  objective: '8.2',
  kind: 'hotspot',
  difficulty: 2,
  topology: furnaceChain,
  prompt:
    'A furnace lights and then shuts down after a few seconds, repeatedly.\n\n' +
    'Click the component that is failing to do its job.',
  answer: 'flame',
  whyWrong: {
    ind: 'The inducer clearly ran — the sequence got as far as lighting.',
    ps: 'The pressure switch clearly closed, or the gas valve would never have opened.',
    ign: 'The igniter clearly worked — the burners lit.',
    gas: 'The gas valve clearly opened. The problem is what happened after.',
  },
  explain:
    'The burners lit, which proves the thermostat, inducer, pressure switch, igniter and gas valve ' +
    'all worked. What failed is the **proof of flame**.\n\n' +
    'Flame rectification passes a tiny DC current — microamps — from the sensor through the flame ' +
    'to the grounded burner. Oxide film on the sensor blocks it, as does a poor burner ground. The ' +
    'board sees no flame, closes the gas valve, and retries.\n\n' +
    'One observation eliminated five of six steps. That is what knowing the sequence buys you.',
  source: cite.todo('Confirm the flame proving discussion against your text.'),
  status: 'draft',
});

const findPurgeProof = defineQuestion({
  ...T,
  id: 'hvac.8.2.hotspot-pressure-switch',
  objective: '8.2',
  kind: 'hotspot',
  difficulty: 3,
  topology: furnaceChain,
  prompt:
    'The inducer runs but the igniter never glows and the gas valve never opens.\n\n' +
    'Click the component most likely blocking the sequence.',
  answer: 'ps',
  whyWrong: {
    ind: 'The inducer is running, so it is doing its job.',
    ign: 'The igniter is downstream of the blockage — it never got permission to energise.',
    gas: 'The gas valve is further downstream still.',
    flame: 'Flame proving comes after ignition, which never happened.',
  },
  explain:
    'The inducer runs, so the call and the inducer circuit are fine. The next step in the chain is ' +
    'the **pressure switch**, which must close to prove the inducer is actually moving air before ' +
    'the board will allow ignition.\n\n' +
    'If it does not close, everything downstream stays dead — which is exactly the symptom.\n\n' +
    'Causes: a blocked or cracked hose to the switch, a blocked flue or intake, a failed switch, ' +
    'or on a condensing furnace a **blocked condensate drain** backing water up into the pressure ' +
    'switch circuit. That last one is one of the most common no-heat calls on high-efficiency ' +
    'equipment.',
  source: cite.todo('Confirm the pressure switch failure modes against your text.'),
  status: 'draft',
});

// --- more 8.1 ---------------------------------------------------------------

const incompleteC0 = defineQuestion({
  ...T,
  id: 'hvac.8.1.carbon-monoxide',
  objective: '8.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What does incomplete combustion of natural gas produce, and what causes it?',
  choices: [
    'Carbon monoxide, usually from insufficient combustion air',
    'Carbon dioxide, from excess air',
    'Nitrogen oxides, from low manifold pressure',
    'Water vapour, from a cold heat exchanger',
  ],
  answer: 0,
  explain:
    'Complete combustion of natural gas produces carbon dioxide and water vapour, both harmless in ' +
    'this context. **Incomplete** combustion produces carbon monoxide.\n\n' +
    'The usual cause is not enough air — a blocked flue, inadequate combustion air openings, a ' +
    'dirty burner, or a cracked heat exchanger disturbing the flame.\n\n' +
    'CO is colourless and odourless. This is why combustion air is a life-safety requirement rather ' +
    'than an efficiency preference, and why a combustion analyser is the instrument that actually ' +
    'answers the question.',
  source: cite.todo('Confirm the combustion discussion against your text.'),
  status: 'draft',
});

const clockingMeter = defineQuestion({
  ...T,
  id: 'hvac.8.1.clocking-the-meter',
  objective: '8.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why would you clock the gas meter on a furnace, and what does it tell you?',
  choices: [
    'It measures the actual firing rate in BTU/h, which is the honest check on whether the furnace matches nameplate input',
    'It measures the efficiency of the heat exchanger',
    'It measures flue gas temperature indirectly',
    'It confirms the manifold pressure is correct',
  ],
  answer: 0,
  explain:
    'You time how long the meter takes to pass a known volume — one cubic foot, say — with every ' +
    'other gas appliance off. From that you get cubic feet per hour, and at roughly 1,000 BTU/ft³ ' +
    'you get the actual input.\n\n' +
    'That is the real firing rate, not what the nameplate claims. Overfiring wastes fuel and can ' +
    'crack a heat exchanger; underfiring means the furnace cannot meet the load.\n\n' +
    'Verify the local heating value with the utility — it varies by supply, and 1,000 BTU/ft³ is a ' +
    'nominal figure rather than a constant.',
  source: cite.todo('Confirm the clocking procedure against your text.'),
  status: 'draft',
});

// --- more 8.2 / 8.3 ---------------------------------------------------------

const blowerOffDelay = defineQuestion({
  ...T,
  id: 'hvac.8.2.blower-delays',
  objective: '8.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why does a furnace blower keep running for a period after the gas valve closes?',
  choices: [
    'To scavenge the remaining heat out of the heat exchanger, for efficiency and to protect it from overheating',
    'To cool the igniter before the next cycle',
    'To purge unburned gas from the combustion chamber',
    'To equalise pressure in the ductwork',
  ],
  answer: 0,
  explain:
    'The heat exchanger is still hot when the burners shut off. Running the blower moves that heat ' +
    'into the house instead of letting it soak away — free capacity you have already paid for.\n\n' +
    'It also protects the exchanger. Heat with no airflow across it drives the high-limit switch ' +
    'open and, over time, stresses the metal.\n\n' +
    'The on-delay at the start exists for the opposite reason: it stops the blower pushing cold air ' +
    'at people before the exchanger has warmed up.',
  source: cite.todo('Confirm the blower delay discussion against your text.'),
  status: 'draft',
});

const hsiHandling = defineQuestion({
  ...T,
  id: 'hvac.8.3.hsi-handling',
  objective: '8.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why must a hot surface igniter be handled only by its ceramic base?',
  choices: [
    'Skin oils on the element cause hot spots that crack it',
    'The element stays hot for hours after operation',
    'The element carries line voltage even when disconnected',
    'Fingerprints interfere with flame rectification',
  ],
  answer: 0,
  explain:
    'Silicon carbide and silicon nitride elements are brittle and heat unevenly if contaminated. ' +
    'Oil from your fingers burns onto the surface, creating a spot that runs hotter than the rest, ' +
    'and thermal stress cracks it — often within a few cycles.\n\n' +
    'They are also fragile mechanically. Dropping one, or knocking it against the burner assembly ' +
    'during installation, is enough to finish it.\n\n' +
    'Handle by the base, install carefully, and check the resistance value against spec before ' +
    'assuming a no-ignition fault is elsewhere.',
  source: cite.todo('Confirm HSI handling guidance against your text and manufacturer instructions.'),
  status: 'draft',
});

const thermocoupleMillivolts = defineQuestion({
  ...T,
  id: 'hvac.8.3.thermocouple-principle',
  objective: '8.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'How does a thermocouple on a standing-pilot system hold the gas valve open?',
  choices: [
    'The flame generates a small DC voltage that energises an electromagnet in the valve',
    'The flame heats a bimetal strip that pushes the valve open',
    'The flame creates pressure that lifts the valve seat',
    'It signals a control board to open the valve',
  ],
  answer: 0,
  explain:
    'Two dissimilar metals joined and heated generate a small voltage — the Seebeck effect. In a ' +
    'pilot flame a thermocouple produces roughly 25 to 30 millivolts.\n\n' +
    'That tiny voltage energises an electromagnet holding the safety valve open. No flame, no ' +
    'millivolts, the magnet releases and the valve closes.\n\n' +
    'It is elegantly self-proving and needs no external power at all, which is why standing-pilot ' +
    'systems keep working in a power cut. The cost is a pilot burning fuel year-round, which is ' +
    'why the design has been superseded.',
  source: cite.todo('Confirm the thermocouple discussion and millivolt values against your text.'),
  status: 'draft',
});

// --- more 8.4 / 8.5 / 8.6 / 8.7 ---------------------------------------------

const crackedHeatExchanger = defineQuestion({
  ...T,
  id: 'hvac.8.4.cracked-exchanger',
  objective: '8.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why is a cracked heat exchanger a condemn-the-furnace condition rather than a repair?',
  choices: [
    'It allows combustion products, including carbon monoxide, to mix with the supply air',
    'It reduces efficiency below the legal minimum',
    'It causes the blower motor to overheat',
    'It voids the manufacturer warranty',
  ],
  answer: 0,
  explain:
    'The heat exchanger is the barrier between combustion gases and the air people breathe. A crack ' +
    'breaches that barrier, and the blower can pull flue products — including carbon monoxide — ' +
    'directly into the supply air.\n\n' +
    'A common tell is a flame that changes shape or rolls out when the blower starts, because the ' +
    'blower is now pulling on the combustion chamber through the crack.\n\n' +
    'This is a shut-it-down-and-red-tag condition. The furnace comes out of service until the ' +
    'exchanger is replaced or the unit is.',
  source: cite.todo('Confirm heat exchanger inspection guidance against your text and code.'),
  status: 'draft',
});

const pvcVenting = defineQuestion({
  ...T,
  id: 'hvac.8.5.why-pvc',
  objective: '8.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why is a condensing furnace vented in PVC rather than metal flue pipe?',
  choices: [
    'Flue gas is cool and acidic, and it will not rise up a conventional chimney anyway',
    'PVC is cheaper and code allows it',
    'PVC handles higher temperatures than metal',
    'Metal would create too much draft',
  ],
  answer: 0,
  explain:
    'A condensing furnace extracts so much heat that the flue gas leaves close to room temperature ' +
    'and carrying liquid condensate. Two consequences follow.\n\n' +
    'It has no buoyancy, so it will not rise up a masonry chimney — the inducer has to push it, ' +
    'which makes it a positive-pressure (Category IV) vent that must be sealed.\n\n' +
    'And the condensate is mildly acidic, which attacks metal flue pipe. PVC handles both the low ' +
    'temperature and the acidity.\n\n' +
    'Venting a high-efficiency furnace into an existing chimney is a serious and unfortunately ' +
    'common installation error.',
  source: cite.todo('Confirm venting requirements against your text and the applicable fuel gas code.'),
  status: 'draft',
});

const expansionTank = defineQuestion({
  ...T,
  id: 'hvac.8.6.waterlogged-tank',
  objective: '8.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A boiler relief valve discharges every time the system heats up.\n\nWhat should you check first?',
  choices: [
    'The expansion tank — a waterlogged tank cannot absorb the volume change as water heats',
    'The circulator pump, which is over-pumping',
    'The aquastat setting, which is too high',
    'The relief valve, which has failed open',
  ],
  answer: 0,
  explain:
    'Water expands as it heats, and it is nearly incompressible. The expansion tank exists to give ' +
    'that extra volume somewhere to go, using an air cushion behind a bladder.\n\n' +
    'If the bladder has failed or the air charge has been lost, the tank fills with water and has ' +
    'no cushion left. The pressure then rises sharply on every heating cycle, and the relief valve ' +
    'does exactly what it should.\n\n' +
    'Replacing the relief valve is treating the symptom — the new one will discharge too. Check the ' +
    'tank\'s air charge against system fill pressure.',
  source: cite.todo('Confirm the expansion tank discussion against your text.'),
  status: 'draft',
});

const electricHeatEfficiency = defineQuestion({
  ...T,
  id: 'hvac.8.7.electric-vs-heatpump',
  objective: '8.7',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Electric resistance heat is 100% efficient at the appliance. Why is a heat pump still much ' +
    'cheaper to run?',
  choices: [
    'A heat pump moves existing heat rather than creating it, delivering two to four times more heat per unit of electricity',
    'Heat pumps use less electricity per hour',
    'Resistance heat wastes energy up the flue',
    'Heat pumps are rated on a different efficiency scale that is not comparable',
  ],
  answer: 0,
  explain:
    '100% efficient sounds impressive but simply means all the electricity becomes heat. One unit ' +
    'in, one unit out.\n\n' +
    'A heat pump does not create heat — it **moves** heat that already exists in the outdoor air. ' +
    'One unit of electricity can move two to four units of heat, so it exceeds 100% in the sense ' +
    'that matters to a power bill.\n\n' +
    'That is why strips are a supplement rather than a primary heat source wherever a heat pump is ' +
    'available, and why a customer left in emergency heat all winter gets a shocking bill.',
  source: cite.todo('Confirm the efficiency comparison against your text.'),
  status: 'draft',
});

export const SECTOR_8_QUESTIONS: readonly Question[] = [
  combustionRequirements,
  incompleteC0,
  naturalGasProperties,
  clockingMeter,
  furnaceSequence,
  findFlameProof,
  findPurgeProof,
  shortCycleLockout,
  blowerOffDelay,
  ignitionTypes,
  hsiHandling,
  thermocoupleMillivolts,
  condensingFurnace,
  crackedHeatExchanger,
  ventCategories,
  pvcVenting,
  backdrafting,
  hydronicComponents,
  expansionTank,
  electricHeatSequencer,
  electricHeatEfficiency,
];
