import { cite, defineQuestion } from '@engine/define';
import type { Question } from '@engine/types';

/** Sector 7 — Psychrometrics. */

const T = { track: 'hvac', domain: '7.0' } as const;

// --- 7.1 The properties -------------------------------------------------------

const propertyDefinitions = defineQuestion({
  ...T,
  id: 'hvac.7.1.properties',
  objective: '7.1',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each psychrometric property to what it measures.',
  pairs: [
    ['Dry bulb', 'Air temperature as an ordinary thermometer reads it'],
    ['Wet bulb', 'Temperature with evaporative cooling; reflects total heat content'],
    ['Dew point', 'The temperature at which the air would begin to condense'],
    ['Relative humidity', 'How close the air is to saturation, as a percentage, at its current temperature'],
    ['Humidity ratio', 'The actual mass of water per pound of dry air, in grains'],
    ['Enthalpy', 'Total heat content — sensible and latent together — in Btu per pound'],
  ],
  explain:
    'The pair worth separating carefully is relative humidity and humidity ratio. RH is relative ' +
    'to temperature: heat air without adding water and RH falls, though there is exactly as much ' +
    'water in it. Humidity ratio and dew point measure the actual moisture, so they do not move ' +
    'when you only change temperature.\n\n' +
    'That is why RH alone is a poor way to talk about a moisture problem, and why grains and dew ' +
    'point are what the trade uses when it matters.',
  source: cite.todo('Confirm the property definitions against your text or ASHRAE Fundamentals Ch. 1.'),
  status: 'draft',
});

const saturatedAir = defineQuestion({
  ...T,
  id: 'hvac.7.1.saturation',
  objective: '7.1',
  kind: 'choice',
  difficulty: 2,
  prompt: 'What is true of air at 100% relative humidity?',
  choices: [
    'Dry bulb, wet bulb and dew point are all the same temperature',
    'The air contains the maximum possible water at any temperature',
    'Wet bulb is higher than dry bulb',
    'The dew point is higher than the dry bulb',
  ],
  answer: 0,
  whyWrong: {
    1: 'The maximum depends on temperature — warmer air holds far more.',
    2: 'Wet bulb can never exceed dry bulb.',
    3: 'Dew point can never exceed dry bulb.',
  },
  explain:
    'At saturation there is no evaporation left to cool the wet-bulb thermometer, so it reads the ' +
    'same as dry bulb. And since the air is already at the point of condensing, dew point equals ' +
    'both.\n\n' +
    'The gap between dry bulb and wet bulb is therefore a direct read on how dry the air is — the ' +
    'wider the spread, the more evaporation is happening, and the drier the air. That is the ' +
    'whole principle behind a sling psychrometer.',
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1'),
  status: 'verified',
});

// --- 7.2 The chart ---------------------------------------------------------------

const chartNavigation = defineQuestion({
  ...T,
  id: 'hvac.7.2.two-properties',
  objective: '7.2',
  kind: 'choice',
  difficulty: 2,
  prompt: 'How many properties must you know to fix a point on the psychrometric chart?',
  choices: [
    'Two — any two independent properties determine every other one',
    'One is enough',
    'Three, at minimum',
    'All six must be measured',
  ],
  answer: 0,
  explain:
    'Any two independent properties locate the point, and the chart then gives you the rest. That ' +
    'is why a sling psychrometer is such a useful instrument: dry bulb and wet bulb are two ' +
    'readings from one tool, and from them come RH, dew point, grains, enthalpy and specific ' +
    'volume.\n\n' +
    'The caveat is "independent". Dry bulb and dry bulb is one property measured twice. At ' +
    'saturation, dry bulb and wet bulb stop being independent because they are equal — which is ' +
    'why saturated air needs a different pair to pin it down.',
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1'),
  status: 'verified',
});

const processDirections = defineQuestion({
  ...T,
  id: 'hvac.7.2.process-directions',
  objective: '7.2',
  kind: 'match',
  difficulty: 3,
  prompt: 'Match each air-handling process to how it moves on the psychrometric chart.',
  pairs: [
    ['Sensible cooling', 'Straight left at constant humidity ratio'],
    ['Sensible heating', 'Straight right at constant humidity ratio'],
    ['Cooling with dehumidification', 'Down and to the left, toward the saturation curve'],
    ['Humidification', 'Straight up at constant dry bulb, for steam injection'],
    ['Evaporative cooling', 'Up and to the left along a line of constant wet bulb'],
  ],
  explain:
    'Horizontal movement is sensible; vertical movement is latent. A real cooling coil does both ' +
    'at once, which is why its process line runs diagonally down and left toward the coil\'s ' +
    'apparatus dew point.\n\n' +
    'Evaporative cooling is the interesting one: it drops dry bulb while raising moisture, and it ' +
    'follows a constant wet-bulb line because it adds no heat overall — it converts sensible heat ' +
    'into latent heat. That is also why it works well in dry climates and barely at all in humid ' +
    'ones.',
  source: cite.todo('Confirm the process directions against your text or ASHRAE Fundamentals Ch. 1.'),
  status: 'draft',
});

// --- 7.3 Heat formulas ------------------------------------------------------------

const formulaMatch = defineQuestion({
  ...T,
  id: 'hvac.7.3.formulas',
  objective: '7.3',
  kind: 'match',
  difficulty: 2,
  prompt: 'Match each heat formula to what it calculates.',
  pairs: [
    ['Qs = 1.08 × CFM × ΔT', 'Sensible heat, from a dry-bulb temperature difference'],
    ['Ql = 0.68 × CFM × Δgrains', 'Latent heat, from a moisture difference'],
    ['Qt = 4.5 × CFM × Δh', 'Total heat, from an enthalpy difference'],
    ['Q = 500 × GPM × ΔT', 'Heat carried by water in a hydronic loop'],
  ],
  explain:
    'The constants all come from the same shape: 60 minutes per hour, times a density, times a ' +
    'specific heat. For air, 60 × 0.075 lb/ft³ × 0.24 Btu/lb·°F = 1.08. For water, 60 × 8.33 ' +
    'lb/gal × 1.0 = 500.\n\n' +
    'Because the air constants depend on density, they shrink at altitude. At 5,000 ft the 1.08 ' +
    'is closer to 0.90, and using the sea-level number overstates capacity by around 17%.',
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1 (standard air constants)'),
  status: 'verified',
});

const totalVsSensible = defineQuestion({
  ...T,
  id: 'hvac.7.3.total-exceeds-sensible',
  objective: '7.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A coil is measured at 24,000 BTU/h total capacity and 18,000 BTU/h sensible.\n\n' +
    'What accounts for the difference?',
  choices: [
    'Latent capacity — 6,000 BTU/h of moisture removal that never shows on a thermometer',
    'Measurement error; the two should be equal',
    'Heat lost through the duct walls',
    'Fan motor heat added to the airstream',
  ],
  answer: 0,
  explain:
    'Total = sensible + latent, so latent is 24,000 − 18,000 = 6,000 BTU/h. That is the energy ' +
    'spent condensing water out of the air, and a thermometer cannot see any of it.\n\n' +
    'The ratio, 18,000 ÷ 24,000 = 0.75, is the sensible heat ratio. It is the reason a system can ' +
    'satisfy a thermostat and leave a house feeling clammy: if airflow is set too high the coil ' +
    'runs warmer, SHR climbs toward 1.0, and the system stops dehumidifying while still hitting ' +
    'temperature.',
  source: cite.standard('Qt = Qs + Ql'),
  status: 'verified',
});

// --- 7.4 SHR ------------------------------------------------------------------------

const shrApplication = defineQuestion({
  ...T,
  id: 'hvac.7.4.humid-climate-airflow',
  objective: '7.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A house in a humid climate reaches setpoint but feels damp. Static pressure and charge both ' +
    'check out, and airflow measures 440 CFM per ton.\n\nWhat is the appropriate adjustment?',
  choices: [
    'Reduce airflow toward 350 CFM per ton so the coil runs colder and removes more moisture',
    'Increase airflow to move more air past the coil',
    'Add refrigerant to lower the coil temperature',
    'Raise the thermostat setpoint',
  ],
  answer: 0,
  whyWrong: {
    1: 'More airflow raises coil temperature and removes less moisture — the wrong direction.',
    2: 'Overcharging does not lower coil temperature, and it damages the compressor.',
    3: 'That changes comfort by making the house warmer, not drier.',
  },
  explain:
    'Airflow sets the coil temperature. Less air over the same coil means the refrigerant has ' +
    'less heat arriving to boil it, so the coil runs colder — further below the air\'s dew point, ' +
    'and condensing more water out of it.\n\n' +
    'At 440 CFM/ton the coil is running warm and the sensible heat ratio is high: the system is ' +
    'spending its capacity on temperature and almost none on moisture. Dropping toward 350 shifts ' +
    'that balance.\n\n' +
    'The trade-off is real — go too low and the coil ices. 350 CFM/ton is the bottom of the band ' +
    'for this reason, and verifying superheat afterwards confirms you have not gone too far.',
  source: cite.todo('Confirm the airflow/dehumidification relationship against your text.'),
  status: 'draft',
});

// --- 7.5 Comfort ---------------------------------------------------------------------

const comfortRange = defineQuestion({
  ...T,
  id: 'hvac.7.5.humidity-comfort',
  objective: '7.5',
  kind: 'choice',
  difficulty: 2,
  prompt: 'Why does a house at 75°F and 65% RH feel less comfortable than the same house at 78°F and 45% RH?',
  choices: [
    'High humidity slows evaporation from the skin, which is how the body sheds heat',
    'Humid air conducts heat into the body faster',
    'Humidity raises the actual air temperature',
    'Humid air is denser and presses on the skin',
  ],
  answer: 0,
  explain:
    'The body loses a large share of its heat by evaporating moisture from the skin. That rate ' +
    'depends on how much more water the surrounding air can accept — so as humidity rises, ' +
    'evaporation slows and the same air temperature feels warmer.\n\n' +
    'This is why controlling moisture is worth as much as controlling temperature, and why a ' +
    'correctly dehumidifying system lets a customer sit comfortably at a higher setpoint. That ' +
    'higher setpoint is also cheaper to run, which makes it an easy conversation to have.',
  source: cite.todo('Confirm the comfort discussion against your text or ASHRAE Standard 55.'),
  status: 'draft',
});

// --- more 7.1 ---------------------------------------------------------------

const rhVsGrains = defineQuestion({
  ...T,
  id: 'hvac.7.1.heating-drops-rh',
  objective: '7.1',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'Air at 60°F and 70% RH is heated to 75°F with no moisture added or removed.\n\n' +
    'What happens to the relative humidity and the grains of moisture?',
  choices: [
    'RH falls; grains stay exactly the same',
    'Both fall',
    'RH stays the same; grains fall',
    'Both rise',
  ],
  answer: 0,
  explain:
    'Grains measure the **actual** water content, and nothing added or removed it — so grains are ' +
    'unchanged.\n\n' +
    'Relative humidity is relative to what the air *could* hold at its current temperature, and ' +
    'warmer air can hold much more. Same water, bigger capacity, so RH falls.\n\n' +
    'This is why winter indoor air feels dry: cold outdoor air with modest moisture is heated to ' +
    'room temperature, and its RH collapses. Nothing dried it out — you just raised its capacity.',
  source: cite.standard('ASHRAE Handbook — Fundamentals, Ch. 1'),
  status: 'verified',
});

const dewPointMeaning = defineQuestion({
  ...T,
  id: 'hvac.7.1.dew-point-condensation',
  objective: '7.1',
  kind: 'choice',
  difficulty: 2,
  prompt:
    'Room air has a dew point of 58°F. A supply duct in an unconditioned attic runs at 52°F.\n\n' +
    'What happens?',
  choices: [
    'Condensation forms on the duct, because its surface is below the air\'s dew point',
    'Nothing, as long as the duct is insulated on the inside',
    'The duct will frost over',
    'The air in the duct will become saturated',
  ],
  answer: 0,
  explain:
    'Dew point is the temperature at which air begins to condense. Any surface colder than the ' +
    'surrounding air\'s dew point will collect water.\n\n' +
    '52°F duct surface, 58°F dew point → condensation, and in an attic that means dripping onto a ' +
    'ceiling.\n\n' +
    'The fix is insulation with a proper **vapour barrier** on the outside, so humid air never ' +
    'reaches the cold surface. Insulation alone without a sealed barrier just moves the ' +
    'condensation inside the insulation, where it does more damage unseen.',
  source: cite.standard('Dew point definition — ASHRAE Handbook Fundamentals Ch. 1'),
  status: 'verified',
});

// --- more 7.3 ---------------------------------------------------------------

const sensibleCalc = defineQuestion({
  ...T,
  id: 'hvac.7.3.sensible-calc',
  objective: '7.3',
  kind: 'input',
  difficulty: 2,
  prompt:
    '1,200 CFM of air is cooled from 76°F to 56°F dry bulb.\n\n' +
    'How much sensible heat is removed, in BTU/h?',
  placeholder: 'BTU/h',
  accept: ['25920'],
  tolerance: 400,
  explain:
    'Qs = 1.08 × CFM × ΔT = 1.08 × 1,200 × 20 = **25,920 BTU/h**.\n\n' +
    'That is a little over two tons of sensible capacity. Note this is only the sensible portion — ' +
    'total capacity including moisture removal would be higher, and the difference is the latent ' +
    'work the coil is also doing.',
  source: cite.standard('Qs = 1.08 × CFM × ΔT'),
  status: 'verified',
});

const latentFromTotal = defineQuestion({
  ...T,
  id: 'hvac.7.3.latent-by-difference',
  objective: '7.3',
  kind: 'input',
  difficulty: 3,
  prompt:
    'A coil measures 36,000 BTU/h total capacity and 27,000 BTU/h sensible.\n\n' +
    'What is the latent capacity, in BTU/h?',
  placeholder: 'BTU/h',
  accept: ['9000'],
  tolerance: 200,
  explain:
    'Total = sensible + latent, so latent = 36,000 − 27,000 = **9,000 BTU/h**.\n\n' +
    'That 9,000 BTU/h is spent condensing water out of the air and never appears on a thermometer. ' +
    'It is what makes a house feel comfortable rather than merely cool.\n\n' +
    'The sensible heat ratio here is 27,000 ÷ 36,000 = 0.75, which is a reasonable figure for a ' +
    'system doing real dehumidification.',
  source: cite.standard('Qt = Qs + Ql'),
  status: 'verified',
});

const altitudeConstant = defineQuestion({
  ...T,
  id: 'hvac.7.3.altitude-effect',
  objective: '7.3',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'You use Qs = 1.08 × CFM × ΔT on a job at 5,000 ft elevation.\n\nWhat is the problem?',
  choices: [
    'The 1.08 assumes sea-level air density; at altitude it is closer to 0.90, so you overstate capacity',
    'The formula does not apply above 3,000 ft at all',
    'ΔT must be measured in Celsius at altitude',
    'There is no problem — the constant is universal',
  ],
  answer: 0,
  explain:
    'The 1.08 is 60 min/h × 0.075 lb/ft³ × 0.24 BTU/lb·°F. That 0.075 is standard air density at ' +
    'sea level.\n\n' +
    'At 5,000 ft the air is thinner — around 0.0625 lb/ft³ — so the constant drops to roughly ' +
    '0.90. Using 1.08 overstates capacity by about 17%.\n\n' +
    'This is not a rounding error. It affects equipment selection, duct sizing and the airflow ' +
    'you calculate from a temperature drop. A Denver job genuinely does not behave like the same ' +
    'equipment in Houston.',
  source: cite.standard('Air density at altitude — ASHRAE Handbook Fundamentals Ch. 1'),
  status: 'verified',
});

const hydronicCalc = defineQuestion({
  ...T,
  id: 'hvac.7.3.hydronic-calc',
  objective: '7.3',
  kind: 'input',
  difficulty: 2,
  prompt:
    'A hydronic loop circulates 12 GPM with a 20°F temperature difference.\n\n' +
    'How much heat is it carrying, in BTU/h?',
  placeholder: 'BTU/h',
  accept: ['120000'],
  tolerance: 2000,
  explain:
    'Q = 500 × GPM × ΔT = 500 × 12 × 20 = **120,000 BTU/h** — ten tons.\n\n' +
    'The 500 is 60 min/h × 8.33 lb/gal × 1.0 BTU/lb·°F. Compare what it takes in air: 120,000 ' +
    'BTU/h at a 20°F drop needs about 5,600 CFM, which is a very large duct.\n\n' +
    'That contrast is the whole argument for hydronic distribution in a large building.',
  source: cite.standard('Q = 500 × GPM × ΔT'),
  status: 'verified',
});

// --- more 7.4 / 7.5 ---------------------------------------------------------

const shrMeaning = defineQuestion({
  ...T,
  id: 'hvac.7.4.shr-interpretation',
  objective: '7.4',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A system is measured with a sensible heat ratio of 0.95.\n\nWhat does that tell you?',
  choices: [
    'Almost all its capacity is going into temperature and it is doing very little dehumidification',
    'It is running very efficiently',
    'It is removing a lot of moisture',
    'The system is oversized',
  ],
  answer: 0,
  explain:
    'SHR is sensible ÷ total. At 0.95, 95% of the capacity is lowering temperature and only 5% is ' +
    'removing moisture.\n\n' +
    'In a dry climate that is exactly right. In a humid one it is a problem: the house will hit ' +
    'setpoint and still feel damp, because the coil is running too warm to condense much water.\n\n' +
    'The usual cause is airflow set too high. Reducing it toward 350 CFM/ton drops the coil ' +
    'temperature, pushes more capacity into latent work, and brings SHR down.',
  source: cite.standard('SHR = Qs ÷ Qt'),
  status: 'verified',
});

const oversizedShortCycle = defineQuestion({
  ...T,
  id: 'hvac.7.5.oversized-humidity',
  objective: '7.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'An oversized system in a humid climate cools the house quickly but leaves it feeling clammy.\n\n' +
    'Why does oversizing hurt dehumidification specifically?',
  choices: [
    'It satisfies the thermostat and shuts off before the coil has run long enough to condense much water',
    'Larger coils are inherently worse at dehumidifying',
    'Oversized systems always run at higher airflow per ton',
    'The extra capacity raises the coil temperature',
  ],
  answer: 0,
  explain:
    'Dehumidification takes time. The coil has to get cold, stay cold, and have water actually run ' +
    'off it — and a large part of each cycle is spent just getting the coil down to temperature.\n\n' +
    'An oversized system drops the dry bulb fast, satisfies the thermostat, and shuts off. Short ' +
    'cycles mean the coil never spends long in the condensing regime, and on shutdown the water ' +
    'sitting on it re-evaporates back into the house.\n\n' +
    'This is why "bigger is better" is wrong for comfort, and why proper load calculation matters ' +
    'more in humid climates than dry ones.',
  source: cite.todo('Confirm the oversizing discussion against your text or ACCA Manual J.'),
  status: 'draft',
});

const ventilationLoad = defineQuestion({
  ...T,
  id: 'hvac.7.5.outdoor-air-load',
  objective: '7.5',
  kind: 'choice',
  difficulty: 3,
  prompt:
    'A building brings in outdoor air for ventilation. In a humid climate, what does that add to the load?',
  choices: [
    'A large latent load, because outdoor air must be dehumidified as well as cooled',
    'Only a sensible load, since ventilation air is filtered',
    'No additional load if the outdoor air is cooler than indoors',
    'A load only during the hottest hours',
  ],
  answer: 0,
  explain:
    'Ventilation air arrives at outdoor conditions, and in a humid climate that means a lot of ' +
    'moisture. Bringing it to indoor conditions requires removing that moisture, which is latent ' +
    'load.\n\n' +
    'The trap in the "cooler than indoors" reasoning: a 72°F night with 90% RH holds far more ' +
    'moisture than 78°F indoor air at 50%. Cooler is not drier, and dew point is what tells you.\n\n' +
    'This is why energy recovery ventilators exist — they pre-condition incoming air against the ' +
    'outgoing stream, transferring both heat and moisture, so the equipment sees a much smaller ' +
    'ventilation load.',
  source: cite.todo('Confirm the ventilation load discussion against your text or ASHRAE 62.'),
  status: 'draft',
});

export const SECTOR_7_QUESTIONS: readonly Question[] = [
  propertyDefinitions,
  rhVsGrains,
  dewPointMeaning,
  saturatedAir,
  chartNavigation,
  processDirections,
  formulaMatch,
  sensibleCalc,
  latentFromTotal,
  altitudeConstant,
  hydronicCalc,
  totalVsSensible,
  shrMeaning,
  shrApplication,
  oversizedShortCycle,
  ventilationLoad,
  comfortRange,
];
