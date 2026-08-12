import { cite, defineQuestion } from '@engine/define';
import type { Question, Topology } from '@engine/types';

/**
 * Sector 6 — Airflow & Duct Systems.
 *
 * The side of the job that gets skipped. A system can be perfectly charged and
 * still fail to cool a house because nobody measured static pressure.
 */

const T = { track: 'hvac', domain: '6.0' } as const;

const staticDiagram: Topology = {
  caption: 'Where a manometer goes to read total external static pressure',
  nodes: [
    { id: 'ret', kind: 'damper', label: 'Return', sublabel: 'filter rack', col: 0, row: 1 },
    { id: 'probe1', kind: 'sensor', label: 'Probe 1', sublabel: 'reads negative', col: 1, row: 1 },
    { id: 'ahu', kind: 'blower', label: 'Air handler', sublabel: 'rated 0.50 in.', col: 2, row: 1 },
    { id: 'probe2', kind: 'sensor', label: 'Probe 2', sublabel: 'reads positive', col: 3, row: 1 },
    { id: 'sup', kind: 'damper', label: 'Supply plenum', col: 4, row: 1 },
  ],
  links: [
    { from: 'ret', to: 'probe1' },
    { from: 'probe1', to: 'ahu' },
    { from: 'ahu', to: 'probe2' },
    { from: 'probe2', to: 'sup' },
  ],
};

// --- 6.1 CFM ------------------------------------------------------------------

const cfmPerTonRule = defineQuestion({
  ...T,
  id: 'hvac.6.1.cfm-per-ton',
  objective: '6.1',
  kind: 'choice',
  difficulty: 1,
  prompt: 'What is the design airflow for a cooling system, and what is the acceptable range?',
  choices: [
    '400 CFM per ton, with 350–450 acceptable',
    '400 CFM total, regardless of system size',
    '100 CFM per ton, with 80–120 acceptable',
    '1,000 CFM per ton, with 900–1,100 acceptable',
  ],
  answer: 0,
  explain:
    '400 CFM per ton is the design figure, and 350–450 is the working band.\n\n' +
    'Where you aim inside that band depends on climate. Below 400 the coil runs colder and pulls ' +
    'more moisture out — right for a humid climate, and right down at 350 for a system struggling ' +
    'with humidity. Above 400 gives more sensible capacity and less dehumidification, which suits ' +
    'a dry climate.\n\n' +
    'Outside the band things break. Too little air and the coil ices; too much and the coil never ' +
    'gets cold enough to condense, so the house hits setpoint and still feels clammy.',
  source: cite.todo('Confirm the airflow targets against your text.'),
  status: 'draft',
});

// --- 6.2 Static pressure --------------------------------------------------------

const tespMeasurement = defineQuestion({
  ...T,
  id: 'hvac.6.2.tesp-signs',
  objective: '6.2',
  kind: 'choice',
  difficulty: 3,
  topology: staticDiagram,
  prompt:
    'A manometer reads −0.38 in. w.c. in the return and +0.42 in. w.c. in the supply.\n\n' +
    'What is the total external static pressure?',
  choices: ['0.80 in. w.c.', '0.04 in. w.c.', '0.42 in. w.c.', '−0.80 in. w.c.'],
  answer: 0,
  whyWrong: {
    1: 'That is what you get by adding the signed values, which cancels most of the reading.',
    2: 'Supply alone is only half the story.',
    3: 'TESP is expressed as a positive magnitude.',
  },
  explain:
    'TESP is the sum of the ABSOLUTE values: 0.38 + 0.42 = 0.80 in. w.c.\n\n' +
    'The return reads negative because the blower is pulling on it and the supply positive because ' +
    'it is pushing. Both represent work the blower is doing, so both count. Adding the signed ' +
    'numbers would give 0.04 and make a severely restricted system look perfect.\n\n' +
    'Most residential air handlers are rated for 0.50 in. w.c. At 0.80 this blower is well past ' +
    'rating, and airflow will be substantially below design no matter how the equipment is ' +
    'charged. This is the measurement that catches undersized ductwork, and it is why a "the ' +
    'equipment is fine" call so often turns out not to be.',
  source: cite.standard('Arithmetic: |−0.38| + |+0.42|'),
  status: 'verified',
});

const highStaticCauses = defineQuestion({
  ...T,
  id: 'hvac.6.2.high-static-causes',
  objective: '6.2',
  kind: 'multi',
  difficulty: 2,
  prompt: 'Which of these raise total external static pressure? Select all that apply.',
  choices: [
    'A loaded or excessively restrictive filter',
    'Undersized return ductwork',
    'A dirty evaporator coil',
    'Closed or blocked supply registers',
    'Low refrigerant charge',
  ],
  answers: [0, 1, 2, 3],
  explain:
    'Everything the air has to squeeze past adds resistance, and the blower answers by developing ' +
    'more pressure and moving less air.\n\n' +
    'Return-side restriction is the most commonly underestimated. Installers routinely fit ' +
    'generous supply ductwork and a single undersized return, and no amount of equipment work ' +
    'fixes it.\n\n' +
    'Refrigerant charge has no bearing on static pressure — that is the air side, entirely ' +
    'separate. Which is exactly why measuring both matters: they fail independently and their ' +
    'symptoms overlap.',
  source: cite.todo('Confirm the causes of high static against your text.'),
  status: 'draft',
});

// --- 6.3 Fan laws ---------------------------------------------------------------

const fanLawSummary = defineQuestion({
  ...T,
  id: 'hvac.6.3.three-laws',
  objective: '6.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each fan law to how the quantity changes with blower speed.',
  pairs: [
    ['Airflow (CFM)', 'Varies directly with RPM'],
    ['Static pressure', 'Varies with the square of RPM'],
    ['Brake horsepower', 'Varies with the cube of RPM'],
  ],
  explain:
    'Direct, square, cube. The consequence is that a modest airflow gain costs a great deal of ' +
    'power: raise speed 25% and you get 25% more air, 56% more static pressure, and 95% more ' +
    'horsepower.\n\n' +
    'This is why speeding a blower up is a poor answer to an airflow complaint. The duct system ' +
    'is the restriction, the motor pays the price, and it eventually fails. Fix the duct.',
  source: cite.standard('Fan affinity laws'),
  status: 'verified',
});

// --- 6.4 Duct sizing --------------------------------------------------------------

const equivalentLength = defineQuestion({
  ...T,
  id: 'hvac.6.4.equivalent-length',
  objective: '6.4',
  kind: 'choice',
  difficulty: 3,
  prompt: 'What does "total equivalent length" account for in duct design?',
  choices: [
    'Straight duct plus the resistance of fittings, expressed as the length of straight duct that would cause the same pressure drop',
    'The physical length of the longest duct run only',
    'The sum of the lengths of every branch in the system',
    'The length of duct required to reach the furthest register',
  ],
  answer: 0,
  explain:
    'Fittings cause far more pressure drop than straight duct, so they are converted into the ' +
    'length of straight duct that would cost the same. A hard 90° elbow might be worth 30 or 40 ' +
    'feet; a boot or a takeoff similarly.\n\n' +
    'That is why a physically short run full of turns can behave like a very long one, and why ' +
    'duct design cannot be done with a tape measure alone.\n\n' +
    'Total equivalent length feeds the friction rate — available static × 100 ÷ TEL — which is the ' +
    'number the duct calculator actually needs.',
  source: cite.todo('Confirm against a duct design manual such as ACCA Manual D.'),
  status: 'draft',
});

// --- 6.5 Blowers -------------------------------------------------------------------

const blowerTypes = defineQuestion({
  ...T,
  id: 'hvac.6.5.ecm-vs-psc',
  objective: '6.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'How does a constant-airflow ECM blower respond to rising duct static pressure, compared with ' +
    'a PSC motor?',
  choices: [
    'The ECM speeds up to hold its airflow target, while a PSC simply moves less air',
    'Both move less air as static rises',
    'The ECM moves less air; a PSC holds airflow constant',
    'Neither is affected by static pressure',
  ],
  answer: 0,
  explain:
    'A PSC motor turns at a roughly fixed speed. Raise the resistance and it simply delivers less ' +
    'air — the fan curve does the work of telling you how much less.\n\n' +
    'A constant-airflow ECM measures torque and adjusts speed to hold the CFM it was commanded to ' +
    'deliver. That is better for comfort, but it hides duct problems: the airflow stays right ' +
    'while the motor works harder and harder, until it hits its limit or fails early.\n\n' +
    'Practical consequence: on an ECM system you cannot infer airflow from the temperature drop ' +
    'and assume the ducts are fine. Measure static pressure directly. A high reading with correct ' +
    'airflow still means the duct system is undersized and the motor is paying for it.',
  source: cite.todo('Confirm ECM behaviour against your text or the manufacturer literature.'),
  status: 'draft',
});

// --- 6.6 Filtration ------------------------------------------------------------------

const mervTradeoff = defineQuestion({
  ...T,
  id: 'hvac.6.6.merv-tradeoff',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A homeowner has fitted a high-MERV 1-inch filter to improve air quality. What is the likely ' +
    'consequence, and what is the better answer?',
  choices: [
    'Higher pressure drop and reduced airflow; use a larger filter area at the same MERV instead',
    'No effect — filter rating does not influence airflow',
    'Improved airflow, because denser media straightens the air',
    'The system will move more air but filter less effectively',
  ],
  answer: 0,
  explain:
    'Finer media captures more, and costs more pressure drop to push air through. In a 1-inch ' +
    'filter slot there is very little media area to spread that across, so a high-MERV 1-inch ' +
    'filter can add several tenths of an inch of static on its own.\n\n' +
    'The fix is area, not rating. A 4- or 5-inch media cabinet holds vastly more surface, so it ' +
    'achieves the same or better filtration at a fraction of the pressure drop, and it loads up ' +
    'far more slowly between changes.\n\n' +
    'Filtration and airflow are a genuine trade-off in a fixed slot, and pretending otherwise is ' +
    'how systems end up starved.',
  source: cite.todo('Confirm the filtration trade-off against your text.'),
  status: 'draft',
});

const filterFirst = defineQuestion({
  ...T,
  id: 'hvac.6.6.iced-coil-cause',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A call reports "no cooling" and you find the evaporator coil frozen into a solid block of ' +
    'ice.\n\nWhat should you do first?',
  choices: [
    'Shut off cooling, run the blower to thaw the coil, and look for the airflow or charge cause while it melts',
    'Connect gauges immediately and read the pressures',
    'Add refrigerant, since low charge causes freezing',
    'Chip the ice off to save time',
  ],
  answer: 0,
  whyWrong: {
    1: 'Gauge readings on an iced system reflect the ice, not the underlying fault.',
    2: 'Low charge is one possible cause, but so is low airflow, and adding refrigerant to the wrong one makes it worse.',
    3: 'Chipping punctures the coil.',
  },
  explain:
    'An iced coil has to be thawed before any reading means anything. The ice itself blocks ' +
    'airflow, which drives suction pressure down further, so the gauges are describing the ' +
    'symptom rather than the cause.\n\n' +
    'While it thaws, work out why. The two families of cause are low airflow — a loaded filter, ' +
    'dirty coil, failed blower, closed registers, undersized ducts — or low charge. The way to ' +
    'separate them once it is running: low charge shows high superheat and low subcooling; low ' +
    'airflow shows a high air-side temperature drop.\n\n' +
    'Not finding the cause guarantees a callback, because it will simply freeze again.',
  source: cite.todo('Confirm the frozen coil procedure against your service text.'),
  status: 'draft',
});

// --- more 6.1 / 6.2 ---------------------------------------------------------

const cfmForTonnage = defineQuestion({
  ...T,
  id: 'hvac.6.1.cfm-for-system',
  objective: '6.1',
  kind: 'input',
  difficulty: 1,
  prompt: 'How much airflow should a 3.5-ton system move at design, in CFM?',
  placeholder: 'CFM',
  accept: ['1400'],
  tolerance: 30,
  explain:
    '3.5 tons × 400 CFM/ton = **1,400 CFM**.\n\n' +
    'The acceptable band, 350–450 CFM/ton, gives 1,225 to 1,575 CFM. Aim toward the low end in a ' +
    'humid climate for better dehumidification, and toward the high end in a dry one for more ' +
    'sensible capacity.',
  source: cite.standard('Arithmetic: 3.5 × 400'),
  status: 'verified',
});

const dryClimateAirflow = defineQuestion({
  ...T,
  id: 'hvac.6.1.climate-airflow-choice',
  objective: '6.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'In a very dry climate, where should you aim within the 350–450 CFM/ton band, and why?',
  choices: [
    'Toward 450, because there is little moisture to remove and higher airflow gives more sensible capacity',
    'Toward 350, to keep the coil as cold as possible',
    'Exactly 400 always, regardless of climate',
    'Below 350, to maximise the temperature drop',
  ],
  answer: 0,
  explain:
    'Airflow sets coil temperature. Less air means a colder coil, which condenses more moisture — ' +
    'valuable in Houston, wasted in Phoenix where there is barely any moisture to remove.\n\n' +
    'In a dry climate you want the capacity going into temperature rather than dehumidification, ' +
    'so run higher airflow with a warmer coil. In a humid climate you sacrifice some sensible ' +
    'capacity to get the latent removal that actually makes the house comfortable.\n\n' +
    'Below 350 the coil risks freezing, which is why that is the floor rather than a preference.',
  source: cite.todo('Confirm the climate airflow guidance against your text.'),
  status: 'draft',
});

const returnStaticSign = defineQuestion({
  ...T,
  id: 'hvac.6.2.why-return-negative',
  objective: '6.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why does a manometer read a negative pressure in the return plenum?',
  choices: [
    'The blower is pulling air out of it, so it sits below atmospheric pressure',
    'The probe is inserted backwards',
    'Return air is colder and therefore denser',
    'Return ducts are always under vacuum by design',
  ],
  answer: 0,
  explain:
    'The blower pulls on the return side and pushes on the supply side. Suction gives a pressure ' +
    'below atmospheric — negative — and discharge gives one above it.\n\n' +
    'Both numbers represent work the blower is doing against restriction, which is why TESP adds ' +
    'their **magnitudes**. Adding the signed values cancels most of the reading and makes a badly ' +
    'restricted system look perfect.',
  source: cite.todo('Confirm the static pressure measurement discussion against your text.'),
  status: 'draft',
});

const tespVerdict = defineQuestion({
  ...T,
  id: 'hvac.6.2.tesp-too-high',
  objective: '6.2',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'An air handler rated for 0.50 in. w.c. measures a TESP of 0.95 in. w.c.\n\n' +
    'What follows from that?',
  choices: [
    'Airflow is well below design and no amount of refrigerant work will fix it',
    'The blower is oversized and should be slowed down',
    'The system is fine as long as the temperature drop is normal',
    'Static pressure that high indicates a refrigerant problem',
  ],
  answer: 0,
  explain:
    'Nearly double the rating means the blower is fighting far more restriction than it was ' +
    'designed for, and it is delivering substantially less air as a result.\n\n' +
    'That has knock-on effects everywhere: the coil runs colder, suction pressure drops, and the ' +
    'system can ice. A technician who only looks at the gauges sees "low suction" and may add ' +
    'refrigerant, making things worse.\n\n' +
    'The cause is upstream of the equipment — undersized ducts, a restrictive filter, closed ' +
    'registers, a crushed flex run. Fixing it means duct work, not equipment work.',
  source: cite.todo('Confirm the high static consequences against your text.'),
  status: 'draft',
});

// --- more 6.3 ---------------------------------------------------------------

const fanLawCalc = defineQuestion({
  ...T,
  id: 'hvac.6.3.doubling-speed',
  objective: '6.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A blower runs at 600 RPM drawing 0.25 BHP. You double the speed to 1,200 RPM.\n\n' +
    'What horsepower does it now draw?',
  choices: ['2.0 BHP', '0.50 BHP', '1.0 BHP', '0.25 BHP'],
  answer: 0,
  whyWrong: {
    1: 'That would be the first fan law — but horsepower follows the cube, not the direct ratio.',
    2: 'That would be the square. Static pressure follows the square; horsepower follows the cube.',
    3: 'Speed changes definitely change power draw.',
  },
  explain:
    'Third fan law: horsepower varies with the **cube** of RPM.\n\n' +
    '0.25 × (1200 ÷ 600)³ = 0.25 × 2³ = 0.25 × 8 = **2.0 BHP**.\n\n' +
    'Doubling airflow costs eight times the power. This is the law that burns out motors when ' +
    'somebody speeds up a blower to chase an airflow complaint — the duct is the restriction, and ' +
    'the motor pays for trying to overcome it.',
  source: cite.standard('Fan affinity laws: BHP ∝ RPM³'),
  status: 'verified',
});

const whichFanLaw = defineQuestion({
  ...T,
  id: 'hvac.6.3.which-law-applies',
  objective: '6.3',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You increase blower speed by 20%. Which quantity increases by roughly 44%?',
  choices: ['Static pressure', 'Airflow', 'Brake horsepower', 'Motor voltage'],
  answer: 0,
  explain:
    'Static pressure follows the square: 1.20² = 1.44, so a 44% rise.\n\n' +
    'Airflow follows directly: 1.20, a 20% rise.\n' +
    'Horsepower follows the cube: 1.20³ = 1.73, a 73% rise.\n\n' +
    'Voltage is set by the supply and does not change with speed.',
  source: cite.standard('Fan affinity laws'),
  status: 'verified',
});

// --- more 6.4 / 6.5 / 6.6 ---------------------------------------------------

const frictionRateCalc = defineQuestion({
  ...T,
  id: 'hvac.6.4.friction-rate-calc',
  objective: '6.4',
  kind: 'input',
  difficulty: 3,
  prompt:
    'A duct design has 0.25 in. w.c. of available static pressure and a total equivalent length of ' +
    '200 ft.\n\nWhat is the friction rate, in in. w.c. per 100 ft?',
  placeholder: 'in. w.c./100 ft',
  accept: ['0.125'],
  tolerance: 0.01,
  explain:
    'FR = (available static × 100) ÷ TEL = (0.25 × 100) ÷ 200 = **0.125** in. w.c. per 100 ft.\n\n' +
    'This is the number you take to the duct calculator to size each run. Note how it falls as ' +
    'equivalent length rises — a long, fitting-heavy system needs larger ducts to achieve the same ' +
    'airflow, because it has less pressure to spend per foot.',
  source: cite.standard('Arithmetic: (0.25 × 100) ÷ 200'),
  status: 'verified',
});

const ductAreaCalc = defineQuestion({
  ...T,
  id: 'hvac.6.4.velocity-to-cfm',
  objective: '6.4',
  kind: 'input',
  difficulty: 2,
  prompt:
    'A 20 in. × 8 in. rectangular duct carries air at 700 feet per minute.\n\n' +
    'How much airflow is that, in CFM?',
  placeholder: 'CFM',
  accept: ['778'],
  tolerance: 25,
  explain:
    'Area first: (20 × 8) ÷ 144 = 160 ÷ 144 = 1.111 ft².\n\n' +
    'Then CFM = velocity × area = 700 × 1.111 = **about 778 CFM**.\n\n' +
    'The ÷144 converts square inches to square feet, and forgetting it is the classic error — it ' +
    'gives an answer 144 times too large.',
  source: cite.standard('CFM = fpm × ft²; area = (w × h) ÷ 144'),
  status: 'verified',
});

const blowerWheelDirty = defineQuestion({
  ...T,
  id: 'hvac.6.5.dirty-blower-wheel',
  objective: '6.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Filter is clean, coil is clean, ducts appear adequate, but airflow is clearly low and static ' +
    'pressure is only slightly elevated.\n\nWhat is worth inspecting?',
  choices: [
    'The blower wheel — dirt packed into the blades stops it moving air, without adding much restriction',
    'The condenser coil',
    'The refrigerant charge',
    'The thermostat calibration',
  ],
  answer: 0,
  explain:
    'A blower wheel with dirt packed into the blade channels loses its shape. The blades can no ' +
    'longer grip the air, so the wheel spins at the right speed and moves far less air.\n\n' +
    'The tell is that static pressure is *not* dramatically high. A restriction downstream raises ' +
    'static; a blower that has stopped working properly moves less air without adding much ' +
    'resistance to the path.\n\n' +
    'It is a genuinely common and frequently missed cause, because it requires pulling the blower ' +
    'to see. Filters that have been left too long, or fitted loosely so air bypasses them, are how ' +
    'it happens.',
  source: cite.todo('Confirm the dirty blower wheel discussion against your service text.'),
  status: 'draft',
});

const filterBypass = defineQuestion({
  ...T,
  id: 'hvac.6.6.filter-bypass',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'A filter is the wrong size and leaves a gap at one edge of the rack.\n\n' +
    'Why does that matter beyond the filtering itself?',
  choices: [
    'Unfiltered air bypasses and loads the coil and blower wheel with dirt',
    'It raises static pressure significantly',
    'It causes the filter to be sucked into the blower',
    'It has no practical effect if the gap is small',
  ],
  answer: 0,
  explain:
    'Air takes the path of least resistance, so it goes through the gap rather than the media. The ' +
    'filter is then doing very little, and everything downstream gets the dirt instead.\n\n' +
    'That is how coils get fouled and blower wheels get packed — both of which are far more ' +
    'expensive to fix than a correctly sized filter.\n\n' +
    'A gapped filter also does not raise static much, so it hides from a static pressure ' +
    'measurement. You have to look at it.',
  source: cite.todo('Confirm the filter bypass discussion against your text.'),
  status: 'draft',
});

const icedCoilThaw = defineQuestion({
  ...T,
  id: 'hvac.6.6.thawing-technique',
  objective: '6.6',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'You need to thaw a frozen evaporator coil. What is the safe way?',
  choices: [
    'Switch the thermostat to fan-only so the blower runs with the compressor off',
    'Chip the ice off carefully with a screwdriver',
    'Run the system in cooling until the ice melts',
    'Apply a heat gun to the coil face',
  ],
  answer: 0,
  whyWrong: {
    1: 'Chipping punctures the coil, turning a service call into a coil replacement.',
    2: 'The compressor is what is making it cold — running it makes the ice worse.',
    3: 'Concentrated heat can damage the fins and any nearby wiring.',
  },
  explain:
    'Fan-only moves room-temperature air across the coil and melts the ice gently, with no risk of ' +
    'damage. It takes time, so use it to inspect the filter, blower and ducts while you wait.\n\n' +
    'Then find the cause before you leave. The two families are low airflow and low charge, and ' +
    'the way to separate them once it is running is the temperature drop: low charge gives a LOW ' +
    'drop, low airflow gives a HIGH one.\n\n' +
    'Not finding the cause guarantees a callback, because it will simply freeze again.',
  source: cite.todo('Confirm the frozen coil procedure against your service text.'),
  status: 'draft',
});

export const SECTOR_6_QUESTIONS: readonly Question[] = [
  cfmPerTonRule,
  cfmForTonnage,
  dryClimateAirflow,
  tespMeasurement,
  returnStaticSign,
  tespVerdict,
  highStaticCauses,
  fanLawSummary,
  fanLawCalc,
  whichFanLaw,
  equivalentLength,
  frictionRateCalc,
  ductAreaCalc,
  blowerTypes,
  blowerWheelDirty,
  mervTradeoff,
  filterBypass,
  filterFirst,
  icedCoilThaw,
];
