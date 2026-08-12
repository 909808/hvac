import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

/** Sector 7 — Psychrometrics. */

const psychrometrics = defineLesson({
  id: 'hvac.lesson.7.chart',
  track: 'hvac',
  domain: '7.0',
  order: 1,
  title: 'Air with water in it',
  summary:
    'Six properties, any two of which fix the rest. This is what lets you explain why a house at ' +
    'setpoint still feels wrong.',
  minutes: 8,
  sections: [
    {
      kind: 'prose',
      body:
        'Psychrometrics is the study of moist air, and it is where comfort complaints get explained. ' +
        'A system that satisfies the thermostat and leaves the house clammy is not doing enough ' +
        '**latent** work — and none of that is visible on a thermometer.\n\n' +
        'There are six properties. Any two independent ones fix the point on the chart, and ' +
        'everything else follows. That is why a sling psychrometer is such a useful instrument: ' +
        'dry bulb and wet bulb are two readings from one tool.',
    },
    {
      kind: 'table',
      heading: 'The six properties',
      columns: ['Property', 'What it measures', 'Units'],
      rows: [
        ['Dry bulb', 'Temperature as an ordinary thermometer reads it', '°F'],
        ['Wet bulb', 'Temperature with evaporative cooling — total heat content', '°F'],
        ['Dew point', 'Where this air would begin to condense', '°F'],
        ['Relative humidity', 'How close to saturation, at its current temperature', '%'],
        ['Humidity ratio', 'Actual mass of water per pound of dry air', 'grains/lb'],
        ['Enthalpy', 'Total heat — sensible and latent together', 'Btu/lb'],
      ],
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'Relative humidity is relative to temperature',
      body:
        'Heat air without adding any water and RH **falls**, even though there is exactly as much ' +
        'water in it. Cool it and RH rises. The moisture never changed.\n\n' +
        'Dew point and grains measure the *actual* moisture, so they do not move when you only ' +
        'change temperature. That is why the trade talks in grains and dew point when it matters, ' +
        'and why "the humidity is 60%" is an ambiguous statement without a temperature attached.',
    },
    {
      kind: 'prose',
      heading: 'The dry-bulb / wet-bulb gap',
      body:
        'A wet-bulb thermometer has a wet sock over it. Water evaporates off the sock, which cools ' +
        'it — and how much it cools depends on how much more moisture the surrounding air can ' +
        'accept.\n\n' +
        'Dry air: lots of evaporation, big drop, wide gap between dry bulb and wet bulb.\n\n' +
        'Saturated air: no evaporation possible, no drop. Dry bulb, wet bulb and dew point are all ' +
        'the same number.\n\n' +
        'So the gap between dry bulb and wet bulb is a direct read on how dry the air is. That is ' +
        'the whole principle of the instrument.',
    },
    {
      kind: 'keyNumbers',
      heading: 'The four heat formulas',
      items: [
        { label: 'Sensible', value: 'Qs = 1.08 × CFM × ΔT', note: 'Dry bulb difference' },
        { label: 'Latent', value: 'Ql = 0.68 × CFM × Δgrains', note: 'Moisture difference' },
        { label: 'Total', value: 'Qt = 4.5 × CFM × Δh', note: 'Enthalpy difference — covers both' },
        { label: 'Water', value: 'Q = 500 × GPM × ΔT', note: 'Hydronic loops' },
        { label: 'Sensible heat ratio', value: 'SHR = Qs ÷ Qt', note: 'Share doing temperature work' },
      ],
    },
    {
      kind: 'prose',
      heading: 'Where the constants come from',
      body:
        'They are not magic numbers. Each is minutes per hour × a density × a specific heat.\n\n' +
        'For air: 60 min/h × 0.075 lb/ft³ × 0.24 Btu/lb·°F = **1.08**.\n\n' +
        'For water: 60 min/h × 8.33 lb/gal × 1.0 Btu/lb·°F = **500**.\n\n' +
        'Because the air constants depend on density, they shrink at altitude. At 5,000 ft the 1.08 ' +
        'is closer to 0.90, and using the sea-level number overstates capacity by around 17%. A ' +
        'Denver job genuinely does not behave like the same equipment in Houston.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: how much of the work is latent?',
      problem:
        'A coil moves 1,200 CFM. Air enters at 78°F DB / 65°F WB and leaves at 57°F DB / 56°F WB.\n\n' +
        'Entering enthalpy is 30.1 Btu/lb, leaving is 23.8 Btu/lb.\n\n' +
        'Find total capacity, sensible capacity, latent capacity and the sensible heat ratio.',
      steps: [
        {
          action: 'Total heat first, from the enthalpy difference. Qt = 4.5 × CFM × Δh',
          result: '4.5 × 1,200 × (30.1 − 23.8) = 4.5 × 1,200 × 6.3 = 34,020 Btu/h',
        },
        {
          action: 'Sensible heat from the dry bulb difference. Qs = 1.08 × CFM × ΔT',
          result: '1.08 × 1,200 × (78 − 57) = 1.08 × 1,200 × 21 = 27,216 Btu/h',
        },
        {
          action: 'Latent is whatever is left over. Ql = Qt − Qs',
          result: '34,020 − 27,216 = 6,804 Btu/h',
        },
        {
          action: 'SHR = sensible ÷ total',
          result: '27,216 ÷ 34,020 = 0.80',
        },
      ],
      answer: 'Total 34,020 · Sensible 27,216 · Latent 6,804 · SHR 0.80',
      moral:
        'A fifth of this coil\'s capacity is doing work no thermometer can see. That latent portion ' +
        'is what makes a house feel comfortable rather than merely cool — and it is the first thing ' +
        'lost when airflow is set too high.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'The humid-house fix is counter-intuitive',
      body:
        'House hits setpoint but feels damp, charge and static check out, airflow measures 440 ' +
        'CFM/ton? **Reduce** airflow toward 350.\n\n' +
        'Less air over the same coil means less heat arriving to boil the refrigerant, so the coil ' +
        'runs colder — further below the air\'s dew point, condensing more water out.\n\n' +
        'More airflow feels like it should help and does the opposite: it raises coil temperature, ' +
        'pushes SHR toward 1.0, and the system stops dehumidifying while still hitting temperature.\n\n' +
        'The limit is real though — go too low and the coil ices. 350 CFM/ton is the bottom of the ' +
        'band for that reason, and you verify superheat afterwards.',
    },
  ],
  source: cite.standard('ASHRAE Handbook — Fundamentals, Chapter 1 (Psychrometrics)'),
  status: 'verified',
}) satisfies Lesson;

export const SECTOR_7_LESSONS: readonly Lesson[] = [psychrometrics];
