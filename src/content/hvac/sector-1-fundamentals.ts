import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/**
 * Sector 1 — Fundamentals & Safety.
 *
 * Physics and units. Everything downstream is built on these definitions, and
 * most of the confusion later in the trade traces back to a shaky grasp of one
 * of them — usually the difference between heat and temperature, or between
 * gauge and absolute pressure.
 */

const T = { track: 'hvac', domain: '1.0' } as const;

// --- 1.1 Heat and temperature ---------------------------------------------

const heatVsTemp = defineQuestion({
  ...T,
  id: 'hvac.1.1.heat-vs-temperature',
  objective: '1.1',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'A cup of boiling water and a bathtub of warm water are compared.\n\n' +
    'Which statement is correct?',
  choices: [
    'The bathtub contains more heat, but the cup is at a higher temperature',
    'The cup contains more heat because it is hotter',
    'They contain the same heat because heat and temperature are the same thing',
    'The bathtub is at a higher temperature because it holds more water',
  ],
  answer: 0,
  whyWrong: {
    1: 'Temperature says nothing about quantity — only about intensity.',
    2: 'Heat is energy; temperature is a measure of molecular activity. They are different quantities.',
    3: 'Volume does not set temperature.',
  },
  explain:
    'Temperature measures the intensity of molecular motion. Heat measures the total quantity of ' +
    'thermal energy, which depends on mass as well as temperature.\n\n' +
    'This distinction is the reason a system can run at the right temperature and still fail to ' +
    'do the job: what a customer feels is heat being moved, and what the thermostat reads is ' +
    'temperature. A unit short on capacity will eventually reach setpoint on a mild day and ' +
    'never reach it on a hot one.',
  source: cite.todo('Confirm against the heat/temperature section of your fundamentals text.'),
  status: 'draft',
});

const btuDefinition = defineQuestion({
  ...T,
  id: 'hvac.1.1.btu',
  objective: '1.1',
  kind: 'choice',
  difficulty: 1,
  prompt: 'What is one BTU defined as?',
  choices: [
    'The heat required to raise one pound of water by one degree Fahrenheit',
    'The heat required to raise one gallon of water by one degree Fahrenheit',
    'The heat required to melt one pound of ice',
    'The heat rejected by one ton of cooling in one hour',
  ],
  answer: 0,
  whyWrong: {
    1: 'The unit is defined per pound, not per gallon. A gallon of water weighs about 8.33 lb.',
    2: 'That is the latent heat of fusion — 144 BTU per pound.',
    3: 'One ton of cooling is 12,000 BTU/h, which is a rate rather than the unit itself.',
  },
  explain:
    'One BTU raises one pound of water one degree Fahrenheit. Water has a specific heat of ' +
    '1.0 BTU/lb·°F by definition — every other material is measured against it.\n\n' +
    'Air, by comparison, has a specific heat of only 0.24 BTU/lb·°F and is far less dense, which ' +
    'is why moving heat with air needs so much more volume than moving it with water.',
  source: cite.todo('Confirm the BTU definition against your fundamentals text.'),
  status: 'draft',
});

const tonOfCooling = defineQuestion({
  ...T,
  id: 'hvac.1.1.ton-of-refrigeration',
  objective: '1.1',
  kind: 'input',
  difficulty: 1,
  prompt: 'How many BTU per hour is one ton of refrigeration?',
  placeholder: 'BTU/h',
  accept: ['12000', '12,000'],
  tolerance: 10,
  explain:
    'One ton of refrigeration is 12,000 BTU/h.\n\n' +
    'The name is literal. It comes from the ice trade: melting one ton of ice over 24 hours ' +
    'absorbs 288,000 BTU (2,000 lb × 144 BTU/lb latent heat of fusion), and 288,000 ÷ 24 = ' +
    '12,000 BTU/h. That is why a "3-ton" system has nothing to do with what it weighs.',
  source: cite.standard('Derived: 2,000 lb × 144 BTU/lb ÷ 24 h'),
  status: 'verified',
});

// --- 1.2 Sensible and latent heat ------------------------------------------

const sensibleVsLatent = defineQuestion({
  ...T,
  id: 'hvac.1.2.sensible-vs-latent',
  objective: '1.2',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each term to what it describes.',
  pairs: [
    ['Sensible heat', 'Heat that changes temperature and can be felt on a thermometer'],
    ['Latent heat', 'Heat that changes state with no change in temperature'],
    ['Latent heat of fusion', 'The 144 BTU/lb absorbed when ice melts to water'],
    ['Latent heat of vaporisation', 'The roughly 970 BTU/lb absorbed when water boils to steam'],
    ['Superheat', 'Sensible heat added to a vapour after it has fully evaporated'],
  ],
  explain:
    'The distinction is the entire basis of refrigeration. A refrigerant absorbs enormous ' +
    'quantities of heat while boiling at a constant temperature — that is latent heat, and it is ' +
    'why a phase change moves so much more energy than simply warming a fluid up.\n\n' +
    'The numbers are worth holding: melting a pound of ice takes 144 BTU, but boiling a pound of ' +
    'water takes about 970. Vaporisation is where the capacity is.',
  source: cite.todo('Confirm the latent heat values against your fundamentals text.'),
  status: 'draft',
});

const changeOfState = defineQuestion({
  ...T,
  id: 'hvac.1.2.constant-temperature',
  objective: '1.2',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A pan of water boils steadily on a burner. A thermometer in the water reads 212°F and stays ' +
    'there while the water boils away.\n\nWhy does the temperature not keep rising?',
  choices: [
    'All the added heat is going into the change of state, not into raising temperature',
    'The thermometer has reached the limit of its range',
    'The burner cannot deliver more heat than that',
    'The water has stopped absorbing heat',
  ],
  answer: 0,
  explain:
    'While a substance changes state, added energy goes entirely into breaking the bonds between ' +
    'molecules rather than speeding them up. Temperature therefore holds constant until the last ' +
    'of the liquid has vaporised.\n\n' +
    'That is exactly what happens in an evaporator. The refrigerant enters as a liquid–vapour ' +
    'mixture and boils at a constant temperature across most of the coil — which is why the ' +
    'saturation temperature can be read straight off a pressure gauge, and why superheat only ' +
    'begins once the last of the liquid is gone.',
  source: cite.standard('Latent heat of vaporisation — standard thermodynamics'),
  status: 'verified',
});

// --- 1.3 Pressure -----------------------------------------------------------

const gaugeVsAbsolute = defineQuestion({
  ...T,
  id: 'hvac.1.3.psig-vs-psia',
  objective: '1.3',
  kind: 'choice',
  difficulty: 2,
  prompt: 'A gauge reads 0 psig at sea level. What is the absolute pressure?',
  choices: ['14.7 psia', '0 psia', '29.92 psia', '−14.7 psia'],
  answer: 0,
  whyWrong: {
    1: '0 psia is a perfect vacuum — no molecules at all.',
    2: '29.92 is inches of mercury at sea level, a different unit.',
    3: 'Absolute pressure cannot be negative.',
  },
  explain:
    'Gauge pressure is measured relative to atmospheric, so 0 psig means "the same as the air ' +
    'around it" — which at sea level is 14.7 psia. psia = psig + 14.7.\n\n' +
    'The distinction matters in evacuation. A gauge cannot usefully show how deep a vacuum is, ' +
    'because the whole useful range is squeezed into the last needle-width before 0 psig. That ' +
    'is why evacuation is measured in microns on an absolute scale, where 500 microns is a ' +
    'meaningful target and "29.9 inches" tells you almost nothing.',
  source: cite.standard('Standard atmosphere: 14.696 psia at sea level'),
  status: 'verified',
});

const micronTarget = defineQuestion({
  ...T,
  id: 'hvac.1.3.micron-target',
  objective: '1.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You are evacuating a system after a repair. What vacuum level should you pull down to, and ' +
    'what must it do before you stop?',
  choices: [
    '500 microns, and it must hold below 500 with the pump valved off',
    '500 microns, then break the vacuum immediately',
    '29.9 inches of mercury on the compound gauge',
    'Whatever the pump reaches after 30 minutes of running',
  ],
  answer: 0,
  whyWrong: {
    1: 'Reaching the number is not the test — holding it is.',
    2: 'A compound gauge cannot resolve the range that matters.',
    3: 'Time is not a measurement. A leaking system will never get there; a clean one may take less.',
  },
  explain:
    'The standard target is 500 microns, and the decay test is what actually proves it: valve off ' +
    'the pump and watch. Holding steady means the system is dry and tight. A rise that levels off ' +
    'around 1,500–2,000 microns means moisture is still boiling off. A rise that keeps climbing ' +
    'with no plateau means a leak.\n\n' +
    'Evacuating by the clock instead of by a micron gauge is how moisture gets sealed into a ' +
    'system, where it reacts with POE oil to form acid and eventually takes out the compressor.',
  source: cite.todo('Confirm the evacuation procedure and target against your text or EPA 608 prep.'),
  status: 'draft',
});

const waterBoilingVacuum = defineQuestion({
  ...T,
  id: 'hvac.1.3.boiling-point-pressure',
  objective: '1.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does pulling a deep vacuum remove moisture from a refrigeration system?',
  choices: [
    'Lowering the pressure lowers water\'s boiling point until it boils at room temperature',
    'The vacuum pump physically sucks the liquid water out',
    'The vacuum chemically breaks water down',
    'Moisture freezes and is removed as ice',
  ],
  answer: 0,
  explain:
    'Boiling point depends on pressure. At 14.7 psia water boils at 212°F; at around 500 microns ' +
    'it boils near room temperature. The vacuum does not suck water out — it makes the water ' +
    'boil, and the pump then removes the vapour.\n\n' +
    'This is also why a cold system evacuates so slowly. If the ambient is below the boiling ' +
    'point at that vacuum, the moisture simply will not vaporise, and gentle heat on the system ' +
    'does more than a bigger pump.',
  source: cite.standard('Pressure–temperature relationship for water'),
  status: 'verified',
});

// --- 1.4 Heat transfer ------------------------------------------------------

const heatTransferModes = defineQuestion({
  ...T,
  id: 'hvac.1.4.transfer-modes',
  objective: '1.4',
  kind: 'match',
  difficulty: 1,
  prompt: 'Match each mode of heat transfer to an example from the trade.',
  pairs: [
    ['Conduction', 'Heat moving through the copper wall of an evaporator tube'],
    ['Convection', 'A blower moving warm room air across the coil'],
    ['Radiation', 'Sun loading a roof and warming the attic below'],
  ],
  explain:
    'All three run at once in real equipment, but the coil is fundamentally a conduction device ' +
    'with convection on both sides — air to metal, metal to refrigerant. That is why fins exist ' +
    '(more surface for convection) and why a dirty coil hurts so much: dirt is an insulator ' +
    'sitting exactly where conduction has to happen.\n\n' +
    'Heat always moves from warmer to cooler. There is no such thing as adding cold — a ' +
    'refrigeration system removes heat and moves it somewhere else.',
  source: cite.todo('Confirm the heat transfer definitions against your fundamentals text.'),
  status: 'draft',
});

// --- 1.5 Tools --------------------------------------------------------------

const instrumentUse = defineQuestion({
  ...T,
  id: 'hvac.1.5.instrument-choice',
  objective: '1.5',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each instrument to what it is for.',
  pairs: [
    ['Manifold gauge set', 'Reading system pressures and adding or recovering refrigerant'],
    ['Micron gauge', 'Measuring the depth of a vacuum during evacuation'],
    ['Clamp meter', 'Reading current without breaking the circuit'],
    ['Manometer', 'Measuring static pressure in ducts and gas pressure at a valve'],
    ['Sling psychrometer', 'Measuring wet bulb, and with it the moisture in the air'],
    ['Combustion analyser', 'Measuring flue gas composition on a fired appliance'],
  ],
  explain:
    'Choosing the instrument is really choosing which question you are asking. Gauges tell you ' +
    'about the refrigerant side, the manometer about the air side, the clamp meter about the ' +
    'electrical side. Reaching for the gauges first on every call is the most common way to spend ' +
    'an hour on what a filter inspection would have answered in ten seconds.',
  source: cite.todo('Confirm the tool list against the instruments chapter of your text.'),
  status: 'draft',
});

// --- 1.6 Safety -------------------------------------------------------------

const refrigerantSafety = defineQuestion({
  ...T,
  id: 'hvac.1.6.refrigerant-hazards',
  objective: '1.6',
  kind: 'multi',
  difficulty: 2,
  prompt: 'Which of these are genuine hazards of handling refrigerant? Select all that apply.',
  choices: [
    'Frostbite from liquid contact with skin or eyes',
    'Asphyxiation, because refrigerant vapour displaces air in a confined space',
    'Toxic decomposition products if refrigerant contacts an open flame',
    'Cylinder rupture if a cylinder is overfilled or heated',
    'Radiation exposure from the refrigerant itself',
  ],
  answers: [0, 1, 2, 3],
  explain:
    'The first four are all real and all documented. Liquid refrigerant boiling on skin causes ' +
    'immediate frostbite, which is why gloves and eye protection are not optional. Vapour is ' +
    'heavier than air and pools in low spaces — basements, crawl spaces, pits — where it displaces ' +
    'oxygen without any warning smell.\n\n' +
    'Decomposition is the one people forget: halogenated refrigerants passing through a flame or ' +
    'a glowing surface break down into hydrogen fluoride and other acids. Never braze on a system ' +
    'with refrigerant still in it.\n\n' +
    'Refrigerants are not radioactive.',
  source: cite.todo('Confirm the hazard list against your safety chapter and the SDS for the refrigerant.'),
  status: 'draft',
});

const lockoutTagout = defineQuestion({
  ...T,
  id: 'hvac.1.6.lockout-tagout',
  objective: '1.6',
  kind: 'choice',
  difficulty: 1,
  prompt:
    'You are about to work inside an air handler with the blower accessible.\n\n' +
    'What is the correct first step?',
  choices: [
    'Open the disconnect, lock it out with your own lock, and verify zero voltage at the equipment',
    'Switch the thermostat to off and start work',
    'Ask whoever is nearby not to touch the thermostat',
    'Pull the blower door interlock and rely on it to keep the blower stopped',
  ],
  answer: 0,
  whyWrong: {
    1: 'A thermostat is a control, not a disconnecting means. Anything can call for the blower.',
    2: 'A verbal request is not a safety device.',
    3: 'An interlock is a convenience feature and can be defeated or fail.',
  },
  explain:
    'Lock out, tag out, then verify. The verification step is the one people skip and the one ' +
    'that matters: test the meter on a known live source, test the equipment, then test the meter ' +
    'again to prove it did not fail between readings.\n\n' +
    'Your own lock, and only you remove it. Equipment with capacitors stays dangerous after the ' +
    'disconnect opens, so discharge them before reaching in.',
  source: cite.standard('OSHA 29 CFR 1910.147 (control of hazardous energy)'),
  status: 'verified',
});

// --- more 1.1 / 1.2 --------------------------------------------------------

const specificHeatWater = defineQuestion({
  ...T,
  id: 'hvac.1.1.specific-heat-comparison',
  objective: '1.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Water has a specific heat of 1.0 BTU/lb·°F and air 0.24 BTU/lb·°F.\n\n' +
    'What does that difference mean in practice?',
  choices: [
    'A pound of water absorbs about four times the heat of a pound of air for the same temperature rise',
    'Water heats up four times faster than air',
    'Air is a better heat-transfer medium than water',
    'Water can only be used below 212°F',
  ],
  answer: 0,
  whyWrong: {
    1: 'It is the opposite — water takes more energy per degree, so it heats up more slowly.',
    2: 'Air carries far less heat per unit mass and is far less dense on top of that.',
    3: 'Specific heat says nothing about the useful temperature range.',
  },
  explain:
    'Specific heat is how much energy one pound absorbs per degree. Water needs four times what ' +
    'air needs — and water is also roughly 800 times denser, so per unit *volume* the gap is ' +
    'enormous.\n\n' +
    'That is the whole argument for hydronic distribution in a large building: a small pipe of ' +
    'water carries what would need a very large duct of air.',
  source: cite.standard('Specific heat values — standard reference data'),
  status: 'verified',
});

const heatOfFusion = defineQuestion({
  ...T,
  id: 'hvac.1.2.melting-ice-energy',
  objective: '1.2',
  kind: 'input',
  difficulty: 2,
  prompt:
    'How much heat does it take to melt 10 pounds of ice at 32°F into 10 pounds of water at 32°F?\n\n' +
    'Answer in BTU.',
  placeholder: 'BTU',
  accept: ['1440'],
  tolerance: 20,
  explain:
    'Latent heat of fusion is 144 BTU per pound. 10 × 144 = 1,440 BTU.\n\n' +
    'Note the temperature never changes — it is 32°F before and 32°F after. Every one of those ' +
    '1,440 BTU went into breaking the bonds that made it a solid, and none into raising ' +
    'temperature. That is what latent heat means.',
  source: cite.standard('Latent heat of fusion of water: 144 BTU/lb'),
  status: 'verified',
});

const evaporatorLatent = defineQuestion({
  ...T,
  id: 'hvac.1.2.why-boiling-matters',
  objective: '1.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Why does a refrigeration system boil its refrigerant rather than simply circulating a cold liquid?',
  choices: [
    'A change of state absorbs far more heat per pound than warming a liquid does',
    'Boiling makes the refrigerant move faster through the pipes',
    'Liquid refrigerant would damage the evaporator',
    'It is a legal requirement for efficiency ratings',
  ],
  answer: 0,
  explain:
    'Compare the numbers. Warming a pound of water across its entire liquid range, 32°F to 212°F, ' +
    'takes 180 BTU. Boiling that same pound takes another 970.\n\n' +
    'A change of state moves several times more energy than heating a liquid ever could. That is ' +
    'why a small copper line can carry the heat of a whole house — and why superheat matters, ' +
    'because once the refrigerant has fully boiled, the coil beyond that point is doing very ' +
    'little.',
  source: cite.standard('Latent heat of vaporisation vs. sensible heat of liquid water'),
  status: 'verified',
});

// --- more 1.3 --------------------------------------------------------------

const psiaConversion = defineQuestion({
  ...T,
  id: 'hvac.1.3.psia-conversion',
  objective: '1.3',
  kind: 'input',
  difficulty: 1,
  prompt:
    'A gauge reads 68 psig at sea level.\n\nWhat is the absolute pressure, in psia?',
  placeholder: 'psia',
  accept: ['82.7'],
  tolerance: 0.5,
  explain:
    'psia = psig + 14.7, so 68 + 14.7 = 82.7 psia.\n\n' +
    'Gauge pressure is measured relative to the atmosphere around you; absolute is measured from ' +
    'a true vacuum. For everyday charging work gauge pressure is what you want, and the ' +
    'distinction rarely comes up — except during evacuation, where the whole useful range lives ' +
    'below 0 psig.',
  source: cite.standard('Standard atmosphere: 14.696 psia at sea level'),
  status: 'verified',
});

const decayTestReading = defineQuestion({
  ...T,
  id: 'hvac.1.3.decay-test-interpretation',
  objective: '1.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You pull a system to 450 microns and valve off the pump. Over the next ten minutes the reading ' +
    'climbs steadily and shows no sign of levelling off.\n\nWhat does that indicate?',
  choices: [
    'A leak — the system is pulling toward atmospheric pressure',
    'Moisture still boiling off',
    'A normal, healthy result',
    'The micron gauge needs recalibrating',
  ],
  whyWrong: {
    1: 'Moisture is a finite source, so it plateaus. A continuous climb is not moisture.',
    2: 'A healthy system holds close to where you left it.',
    3: 'Possible but far less likely than the obvious physical explanation.',
  },
  answer: 0,
  explain:
    'The shape of the curve is the diagnosis:\n\n' +
    '**Holds steady** → dry and tight. Done.\n' +
    '**Rises then plateaus** around 1,500–2,000 microns → moisture still boiling off. Keep pumping.\n' +
    '**Rises without levelling** → a leak, pulling toward atmospheric.\n\n' +
    'A finite amount of water reaches equilibrium. A leak has the whole atmosphere behind it and ' +
    'never settles.',
  source: cite.todo('Confirm the decay test interpretation against your text.'),
  status: 'draft',
});

// --- more 1.4 --------------------------------------------------------------

const dirtyCoilConduction = defineQuestion({
  ...T,
  id: 'hvac.1.4.why-dirt-matters',
  objective: '1.4',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why does a thin layer of dirt on a coil hurt performance so much more than its thickness suggests?',
  choices: [
    'Dirt is an insulator sitting exactly where conduction has to happen',
    'Dirt adds weight to the coil',
    'Dirt reacts chemically with the refrigerant',
    'Dirt changes the refrigerant flow rate',
  ],
  answer: 0,
  explain:
    'A coil is a conduction device with convection on both sides — air to metal, metal to ' +
    'refrigerant. The heat has to cross that metal wall, and every layer of dirt is thermal ' +
    'resistance in series with it.\n\n' +
    'On a condenser this raises condensing temperature and head pressure. On an evaporator it ' +
    'lowers coil temperature toward freezing. Both also restrict airflow, so you get two problems ' +
    'from one cause.',
  source: cite.todo('Confirm the heat transfer discussion against your text.'),
  status: 'draft',
});

// --- more 1.5 / 1.6 ---------------------------------------------------------

const wetBulbInstrument = defineQuestion({
  ...T,
  id: 'hvac.1.5.psychrometer-purpose',
  objective: '1.5',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A sling psychrometer has two thermometers, one with a wet sock over the bulb.\n\n' +
    'Why does the wet one read lower?',
  choices: [
    'Water evaporating off the sock absorbs heat from the bulb',
    'The wet sock insulates the bulb from the air',
    'Water is colder than air',
    'The sock blocks radiant heat',
  ],
  answer: 0,
  explain:
    'Evaporation absorbs latent heat, and it takes that heat from whatever it is evaporating off ' +
    '— in this case the thermometer bulb.\n\n' +
    'How much it cools depends on how much more moisture the surrounding air can accept. Dry air ' +
    'means lots of evaporation and a big drop. Saturated air means none at all, and the two ' +
    'thermometers read the same.\n\n' +
    'That gap between dry bulb and wet bulb is a direct measure of how dry the air is, which is ' +
    'why one instrument gives you two of the six psychrometric properties.',
  source: cite.standard('Evaporative cooling — ASHRAE Handbook Fundamentals Ch. 1'),
  status: 'verified',
});

const nitrogenNotOxygen = defineQuestion({
  ...T,
  id: 'hvac.1.6.never-oxygen',
  objective: '1.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Why must oxygen never be used to pressure-test a refrigeration system?',
  choices: [
    'Oxygen under pressure in contact with oil combusts violently',
    'Oxygen would contaminate the refrigerant',
    'Oxygen leaks too quickly to be useful',
    'Oxygen cylinders are not rated for the pressure',
  ],
  answer: 0,
  explain:
    'This is not a subtle risk. Oxygen under pressure meeting the oil that is inside every ' +
    'refrigeration system produces violent combustion — people have been killed doing this.\n\n' +
    'Use **dry nitrogen with a regulator**. Always a regulator: cylinder pressure runs into the ' +
    'thousands of psi and will burst a component instantly.\n\n' +
    'Compressed air is also wrong — it carries moisture, and with refrigerant present it can form ' +
    'a combustible mixture under pressure.',
  source: cite.todo('Confirm pressure-testing practice against your safety text.'),
  status: 'draft',
});

const confinedSpace = defineQuestion({
  ...T,
  id: 'hvac.1.6.vapour-pools-low',
  objective: '1.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A large refrigerant leak has occurred in a basement mechanical room.\n\n' +
    'What is the specific hazard, and why is it easy to miss?',
  choices: [
    'Vapour is heavier than air and pools low, displacing oxygen with no smell to warn you',
    'Vapour rises and escapes, so there is no hazard indoors',
    'The vapour is flammable and may ignite from a light switch',
    'The main risk is frostbite from breathing cold vapour',
  ],
  answer: 0,
  whyWrong: {
    1: 'Refrigerant vapour is denser than air and sinks.',
    2: 'Common HFC and HCFC refrigerants are not flammable under normal conditions.',
    3: 'Frostbite is a liquid-contact hazard, not an inhalation one.',
  },
  explain:
    'Refrigerant vapour is heavier than air. It pools in basements, crawl spaces, pits and ' +
    'trenches, and it displaces oxygen. There is no warning smell and no immediate discomfort — ' +
    'the first symptom is often confusion, by which point you may not be able to act on it.\n\n' +
    'This is why ventilation and, in commercial machinery rooms, refrigerant monitors exist. If ' +
    'a large leak is suspected in a low space, ventilate before you enter.',
  source: cite.todo('Confirm the asphyxiation hazard discussion against your safety text and ASHRAE 15.'),
  status: 'draft',
});

const meterVerify = defineQuestion({
  ...T,
  id: 'hvac.1.6.why-second-live-test',
  objective: '1.6',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'The live–dead–live procedure ends by testing your meter on a known live source again.\n\n' +
    'Why is that final step the important one?',
  choices: [
    'A meter that failed between readings would show zero volts on an energised circuit',
    'It confirms the circuit is still de-energised',
    'It discharges any stored energy in the meter',
    'It is required to reset the meter between measurements',
  ],
  answer: 0,
  explain:
    'A blown fuse, a flat battery or a broken lead all produce the same reading as a dead circuit: ' +
    'zero volts.\n\n' +
    'Without the final check, "the meter read zero" and "the circuit is dead" are not the same ' +
    'statement — and the gap between them is where people get hurt. Testing the meter afterwards ' +
    'proves it was still working when it told you the circuit was safe.',
  source: cite.standard('NFPA 70E electrical safety practice'),
  status: 'verified',
});

export const SECTOR_1_QUESTIONS: readonly Question[] = [
  heatVsTemp,
  btuDefinition,
  tonOfCooling,
  specificHeatWater,
  sensibleVsLatent,
  changeOfState,
  heatOfFusion,
  evaporatorLatent,
  gaugeVsAbsolute,
  psiaConversion,
  micronTarget,
  decayTestReading,
  waterBoilingVacuum,
  heatTransferModes,
  dirtyCoilConduction,
  instrumentUse,
  wetBulbInstrument,
  refrigerantSafety,
  nitrogenNotOxygen,
  confinedSpace,
  lockoutTagout,
  meterVerify,
];
