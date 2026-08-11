import type { Rng } from '@engine/rng';
import type { Difficulty, LabId, Question } from '@engine/types';
import {
  REFRIGERANTS,
  TARGETS,
  pressureAt,
  saturationTemp,
  subcooling,
  superheat,
  targetSuperheatFixedOrifice,
} from './refrigerant';
import {
  latentHeat,
  sensibleHeat,
  stateFromDryBulbWetBulb,
  totalHeat,
  waterHeat,
} from './psychrometrics';
import { cfmPerTon, fanLaws, frictionRate, totalExternalStatic } from './airflow';

/**
 * Generated calculation drills.
 *
 * Every answer here is computed by the same functions the simulator uses, so
 * these questions carry a `generated` citation rather than a book page: there is
 * no transcription step in which a number could go wrong. They are also
 * unlimited, which matters for the arithmetic you need to be able to do without
 * thinking — P-T lookups, superheat, the 1.08 formula.
 */

const TRACK = 'hvac' as const;

function base(id: string, domain: string, objective: string, difficulty: Difficulty, generator: string) {
  return {
    id,
    track: TRACK,
    domain,
    objective,
    difficulty,
    status: 'verified' as const,
    source: { kind: 'generated' as const, generator },
    tags: ['generated', 'calculation'] as const,
  };
}

/** Build a choice list from a correct answer and candidate distractors. */
function choicesFrom(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
  fallback: () => string,
): { choices: string[]; answer: number } {
  const seen = new Set([correct]);
  const picked: string[] = [];
  for (const d of distractors) {
    if (picked.length >= 3) break;
    if (seen.has(d)) continue;
    seen.add(d);
    picked.push(d);
  }
  let guard = 0;
  while (picked.length < 3 && guard++ < 60) {
    const candidate = fallback();
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    picked.push(candidate);
  }
  const all = rng.shuffle([correct, ...picked]);
  return { choices: all, answer: all.indexOf(correct) };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------------------
// P-T chart
// ---------------------------------------------------------------------------

function ptLookup(rng: Rng, id: string): Question {
  const r = rng.pick(REFRIGERANTS.filter((x) => x.id !== 'R-404A'));
  const tempF = rng.int(30, 120);
  const psig = pressureAt(r.id, tempF);

  return {
    ...base(id, '2.0', '2.3', 1, 'hvac:pt-lookup'),
    kind: 'input',
    prompt: `Using a ${r.id} P-T chart, what is the saturation pressure at ${tempF}°F?\n\nAnswer in psig, to the nearest whole number.`,
    placeholder: 'psig',
    accept: [String(psig)],
    tolerance: 3,
    explain:
      `${r.id} at ${tempF}°F saturates at about ${psig.toFixed(1)} psig. ` +
      `The pressure–temperature relationship only holds where liquid and vapour coexist — in the ` +
      `evaporator and the condenser. In the superheated suction line or the subcooled liquid line ` +
      `a pressure no longer tells you the temperature, which is exactly why superheat and ` +
      `subcooling have to be measured rather than read off a chart.`,
  };
}

function ptReverse(rng: Rng, id: string): Question {
  const r = rng.pick(REFRIGERANTS.filter((x) => x.id !== 'R-404A'));
  const tempF = rng.int(35, 115);
  const psig = pressureAt(r.id, tempF);
  const answer = `${Math.round(saturationTemp(r.id, psig))}°F`;

  const { choices, answer: index } = choicesFrom(
    rng,
    answer,
    [`${tempF + 10}°F`, `${tempF - 10}°F`, `${tempF + 20}°F`],
    () => `${rng.int(20, 130)}°F`,
  );

  return {
    ...base(id, '2.0', '2.3', 1, 'hvac:pt-reverse'),
    kind: 'choice',
    prompt: `Your gauges read ${psig.toFixed(0)} psig on a ${r.id} system.\n\nWhat is the saturation temperature?`,
    choices,
    answer: index,
    explain:
      `${psig.toFixed(0)} psig on the ${r.id} scale corresponds to about ${answer}. ` +
      `This is the number every other refrigerant-side calculation starts from: subtract it from ` +
      `the suction line temperature and you have superheat; subtract the liquid line temperature ` +
      `from it and you have subcooling.`,
  };
}

// ---------------------------------------------------------------------------
// Superheat and subcooling
// ---------------------------------------------------------------------------

function superheatCalc(rng: Rng, id: string): Question {
  const r = rng.pick(['R-410A', 'R-22'] as const);
  const satTemp = rng.int(35, 50);
  const psig = pressureAt(r, satTemp);
  const actualSuperheat = rng.int(3, 30);
  const lineTemp = satTemp + actualSuperheat;

  return {
    ...base(id, '2.0', '2.4', 2, 'hvac:superheat-calc'),
    kind: 'input',
    prompt:
      `A ${r} system reads ${psig.toFixed(0)} psig on the low side, and the suction line ` +
      `measures ${lineTemp}°F.\n\nWhat is the superheat, in °F?`,
    placeholder: '°F',
    accept: [String(superheat(r, psig, lineTemp))],
    tolerance: 2,
    explain:
      `${psig.toFixed(0)} psig on ${r} is a saturation temperature of about ${satTemp}°F. ` +
      `Superheat is suction line temperature minus saturation temperature: ` +
      `${lineTemp} − ${satTemp} = ${actualSuperheat}°F.\n\n` +
      `Superheat tells you how much of the evaporator is still doing useful work. Zero means ` +
      `liquid is leaving the coil and heading for the compressor; a high number means the last ` +
      `stretch of coil has nothing left to boil.`,
  };
}

function subcoolingCalc(rng: Rng, id: string): Question {
  const r = rng.pick(['R-410A', 'R-22'] as const);
  const satTemp = rng.int(95, 125);
  const psig = pressureAt(r, satTemp);
  const actualSubcooling = rng.int(2, 22);
  const lineTemp = satTemp - actualSubcooling;

  return {
    ...base(id, '2.0', '2.5', 2, 'hvac:subcooling-calc'),
    kind: 'input',
    prompt:
      `A ${r} system reads ${psig.toFixed(0)} psig on the high side, and the liquid line ` +
      `measures ${lineTemp}°F.\n\nWhat is the subcooling, in °F?`,
    placeholder: '°F',
    accept: [String(subcooling(r, psig, lineTemp))],
    tolerance: 2,
    explain:
      `${psig.toFixed(0)} psig on ${r} is a condensing temperature of about ${satTemp}°F. ` +
      `Subcooling is condensing temperature minus liquid line temperature: ` +
      `${satTemp} − ${lineTemp} = ${actualSubcooling}°F.\n\n` +
      `Note the subtraction runs the other way from superheat. Subcooling tells you how much ` +
      `liquid is stacked in the condenser, which is what makes it the charge indicator on a TXV ` +
      `system — where the valve holds superheat constant and it therefore tells you nothing.`,
  };
}

function diagnoseFromReadings(rng: Rng, id: string): Question {
  const cases = [
    {
      sh: 'high',
      sc: 'low',
      answer: 'Undercharge or a leak',
      why: 'Not enough refrigerant to fill the evaporator or stack liquid in the condenser.',
    },
    {
      sh: 'high',
      sc: 'high',
      answer: 'Restriction in the liquid line or metering device',
      why: 'Flow is throttled: the coil starves while refrigerant backs up behind the restriction.',
    },
    {
      sh: 'low',
      sc: 'high',
      answer: 'Overcharge',
      why: 'Excess refrigerant floods the condenser and overfeeds the evaporator.',
    },
    {
      sh: 'low',
      sc: 'low',
      answer: 'Metering device overfeeding',
      why: 'The valve is passing too much refrigerant without there being extra charge in the system.',
    },
  ] as const;

  const chosen = rng.pick(cases);
  const { choices, answer } = choicesFrom(
    rng,
    chosen.answer,
    cases.filter((c) => c.answer !== chosen.answer).map((c) => c.answer),
    () => 'Dirty condenser coil',
  );

  return {
    ...base(id, '10.0', '10.2', 3, 'hvac:diagnose-sh-sc'),
    kind: 'choice',
    prompt:
      `A system shows **${chosen.sh} superheat** and **${chosen.sc} subcooling**.\n\n` +
      `What does that pairing point to?`,
    choices,
    answer,
    explain:
      `${chosen.why}\n\n` +
      `The whole table is worth memorising, because the two readings together say something ` +
      `neither says alone:\n\n` +
      `High superheat + LOW subcooling → undercharge\n` +
      `High superheat + HIGH subcooling → restriction\n` +
      `Low superheat + HIGH subcooling → overcharge\n` +
      `Low superheat + LOW subcooling → metering device overfeeding\n\n` +
      `Superheat alone cannot separate an undercharge from a restriction. Subcooling is what ` +
      `distinguishes them, and getting that backwards is how a good metering device gets ` +
      `replaced on a system that was simply low.`,
  };
}

function targetSuperheat(rng: Rng, id: string): Question {
  const indoorWb = rng.int(58, 72);
  const outdoorDb = rng.int(75, 105);
  const target = targetSuperheatFixedOrifice(indoorWb, outdoorDb);

  return {
    ...base(id, '4.0', '4.2', 3, 'hvac:target-superheat'),
    kind: 'input',
    prompt:
      `A fixed-orifice system is running with ${indoorWb}°F indoor wet bulb and ${outdoorDb}°F ` +
      `outdoor dry bulb.\n\nWhat is the approximate target superheat, in °F?`,
    placeholder: '°F',
    accept: [String(target)],
    tolerance: 4,
    explain:
      `The charging chart gives roughly ${target}°F for these conditions.\n\n` +
      `Target superheat rises as the indoor load rises and falls as it gets hotter outside. ` +
      `A fixed orifice has no way to control superheat itself, so it is the only reading that ` +
      `tells you about the charge — which is why the chart exists. On a TXV system the valve ` +
      `holds superheat at 8–12°F regardless of charge, so you charge by subcooling instead.`,
  };
}

// ---------------------------------------------------------------------------
// Psychrometrics
// ---------------------------------------------------------------------------

function psychrometricRead(rng: Rng, id: string): Question {
  const dryBulb = rng.int(70, 90);
  const wetBulb = dryBulb - rng.int(8, 20);
  const state = stateFromDryBulbWetBulb(dryBulb, wetBulb);

  const asked = rng.pick(['rh', 'dewpoint', 'enthalpy', 'grains'] as const);

  const spec = {
    rh: { label: 'relative humidity', value: `${Math.round(state.relativeHumidity)}%`, unit: '%' },
    dewpoint: { label: 'dew point', value: `${Math.round(state.dewPointF)}°F`, unit: '°F' },
    enthalpy: { label: 'enthalpy', value: `${state.enthalpy.toFixed(1)} Btu/lb`, unit: 'Btu/lb' },
    grains: { label: 'moisture content', value: `${Math.round(state.grains)} grains/lb`, unit: 'grains/lb' },
  }[asked];

  const drift = (n: number, by: number) => {
    switch (asked) {
      case 'rh':
        return `${Math.round(n + by * 8)}%`;
      case 'dewpoint':
        return `${Math.round(n + by * 6)}°F`;
      case 'enthalpy':
        return `${(n + by * 3.5).toFixed(1)} Btu/lb`;
      default:
        return `${Math.round(n + by * 15)} grains/lb`;
    }
  };

  const raw = {
    rh: state.relativeHumidity,
    dewpoint: state.dewPointF,
    enthalpy: state.enthalpy,
    grains: state.grains,
  }[asked];

  const { choices, answer } = choicesFrom(
    rng,
    spec.value,
    [drift(raw, 1), drift(raw, -1), drift(raw, 2)],
    () => drift(raw, rng.int(-3, 3) || 3),
  );

  return {
    ...base(id, '7.0', '7.2', 2, 'hvac:psychrometric-read'),
    kind: 'choice',
    prompt:
      `Air measures ${dryBulb}°F dry bulb and ${wetBulb}°F wet bulb at sea level.\n\n` +
      `What is the ${spec.label}?`,
    choices,
    answer,
    explain:
      `At ${dryBulb}°F DB / ${wetBulb}°F WB the air is at ${Math.round(state.relativeHumidity)}% RH, ` +
      `${Math.round(state.dewPointF)}°F dew point, ${Math.round(state.grains)} grains/lb, and ` +
      `${state.enthalpy.toFixed(1)} Btu/lb of enthalpy.\n\n` +
      `Any two properties fix the point on the chart, and everything else follows. The wider the ` +
      `gap between dry bulb and wet bulb, the drier the air — when they meet, the air is saturated ` +
      `and dry bulb, wet bulb and dew point are all the same number.`,
  };
}

function heatFormula(rng: Rng, id: string): Question {
  const which = rng.pick(['sensible', 'latent', 'total', 'water'] as const);
  const cfm = rng.int(3, 20) * 100;

  switch (which) {
    case 'sensible': {
      const deltaT = rng.int(15, 25);
      const answer = sensibleHeat(cfm, deltaT);
      return {
        ...base(id, '7.0', '7.3', 2, 'hvac:heat-sensible'),
        kind: 'input',
        prompt:
          `${cfm} CFM of air is cooled through a ${deltaT}°F dry-bulb temperature drop.\n\n` +
          `How much sensible heat is being removed, in Btu/h?`,
        placeholder: 'Btu/h',
        accept: [String(answer)],
    tolerance: Math.max(50, answer * 0.03),
        explain:
          `Qs = 1.08 × CFM × ΔT = 1.08 × ${cfm} × ${deltaT} = ${answer.toLocaleString()} Btu/h.\n\n` +
          `The 1.08 is not arbitrary: 60 min/h × 0.075 lb/ft³ air density × 0.24 Btu/lb·°F specific ` +
          `heat. At altitude the air thins and the constant drops with it, which is why a Denver ` +
          `system does not behave like the same equipment in Houston.`,
      };
    }

    case 'latent': {
      const deltaGrains = rng.int(10, 35);
      const answer = latentHeat(cfm, deltaGrains);
      return {
        ...base(id, '7.0', '7.3', 3, 'hvac:heat-latent'),
        kind: 'input',
        prompt:
          `${cfm} CFM of air is dehumidified by ${deltaGrains} grains per pound.\n\n` +
          `How much latent heat is being removed, in Btu/h?`,
        placeholder: 'Btu/h',
        accept: [String(answer)],
    tolerance: Math.max(50, answer * 0.03),
        explain:
          `Ql = 0.68 × CFM × Δgrains = 0.68 × ${cfm} × ${deltaGrains} = ${answer.toLocaleString()} Btu/h.\n\n` +
          `Latent capacity is work the system does that never shows on a thermometer. A system ` +
          `that satisfies the thermostat while the house still feels clammy is spending too little ` +
          `of its capacity here — usually because airflow is too high and the coil never gets cold ` +
          `enough to condense.`,
      };
    }

    case 'total': {
      const deltaH = rng.int(4, 12);
      const answer = totalHeat(cfm, deltaH);
      return {
        ...base(id, '7.0', '7.3', 2, 'hvac:heat-total'),
        kind: 'input',
        prompt:
          `${cfm} CFM of air drops ${deltaH} Btu/lb in enthalpy across a coil.\n\n` +
          `What is the total heat removed, in Btu/h?`,
        placeholder: 'Btu/h',
        accept: [String(answer)],
    tolerance: Math.max(50, answer * 0.03),
        explain:
          `Qt = 4.5 × CFM × Δh = 4.5 × ${cfm} × ${deltaH} = ${answer.toLocaleString()} Btu/h.\n\n` +
          `Enthalpy already includes both the temperature and the moisture, so this one formula ` +
          `covers sensible and latent together. That is what makes it the honest measure of what a ` +
          `coil is actually doing — and why total capacity always exceeds the sensible figure.`,
      };
    }

    case 'water': {
      const gpm = rng.int(4, 40);
      const deltaT = rng.int(10, 25);
      const answer = waterHeat(gpm, deltaT);
      return {
        ...base(id, '8.0', '8.6', 2, 'hvac:heat-water'),
        kind: 'input',
        prompt:
          `A hydronic loop circulates ${gpm} GPM with a ${deltaT}°F temperature difference.\n\n` +
          `How much heat is it carrying, in Btu/h?`,
        placeholder: 'Btu/h',
        accept: [String(answer)],
    tolerance: Math.max(50, answer * 0.03),
        explain:
          `Q = 500 × GPM × ΔT = 500 × ${gpm} × ${deltaT} = ${answer.toLocaleString()} Btu/h.\n\n` +
          `The 500 is 60 min/h × 8.33 lb/gal × 1.0 Btu/lb·°F. Water carries roughly 3,500 times ` +
          `more heat per unit volume than air, which is the whole argument for hydronic ` +
          `distribution in a large building.`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Airflow
// ---------------------------------------------------------------------------

function airflowDrill(rng: Rng, id: string): Question {
  const which = rng.pick(['cfm-per-ton', 'fan-law', 'tesp', 'friction'] as const);

  switch (which) {
    case 'cfm-per-ton': {
      const tons = rng.pick([2, 2.5, 3, 3.5, 4, 5]);
      const cfm = Math.round(tons * rng.int(300, 450));
      const answer = cfmPerTon(cfm, tons);
      return {
        ...base(id, '6.0', '6.1', 2, 'hvac:cfm-per-ton'),
        kind: 'input',
        prompt:
          `A ${tons}-ton system is measured at ${cfm} CFM.\n\nHow many CFM per ton is that?`,
        placeholder: 'CFM/ton',
        accept: [String(answer)],
    tolerance: 8,
        explain:
          `${cfm} ÷ ${tons} = ${answer} CFM per ton.\n\n` +
          `Design is 400 CFM/ton, with ${TARGETS.cfmPerTon.min}–${TARGETS.cfmPerTon.max} acceptable. ` +
          `Below that band the coil runs cold and can ice; above it the coil never gets cold enough ` +
          `to pull moisture out and the house feels humid even at setpoint. In a dry climate you ` +
          `aim high in the band, in a humid one you aim low.`,
      };
    }

    case 'fan-law': {
      const cfm1 = rng.int(8, 16) * 100;
      const rpm1 = rng.int(700, 1000);
      const rpm2 = rpm1 + rng.int(100, 300);
      const law = rng.pick(['cfm', 'sp', 'bhp'] as const);

      if (law === 'cfm') {
        const answer = fanLaws.cfm(cfm1, rpm1, rpm2);
        return {
          ...base(id, '6.0', '6.3', 2, 'hvac:fan-law-cfm'),
          kind: 'input',
          prompt:
            `A blower moves ${cfm1} CFM at ${rpm1} RPM. It is sped up to ${rpm2} RPM.\n\n` +
            `What is the new airflow, in CFM?`,
          placeholder: 'CFM',
          accept: [String(answer)],
    tolerance: Math.max(10, answer * 0.03),
          explain:
            `First fan law: CFM varies directly with RPM. ` +
            `${cfm1} × (${rpm2} ÷ ${rpm1}) = ${answer} CFM.\n\n` +
            `This is the gentle one. The other two are what catch people out — static pressure ` +
            `rises with the square of speed and horsepower with the cube, so a modest airflow ` +
            `increase can push a motor past its rating.`,
        };
      }

      if (law === 'sp') {
        const sp1 = rng.int(30, 70) / 100;
        const answer = fanLaws.staticPressure(sp1, rpm1, rpm2);
        return {
          ...base(id, '6.0', '6.3', 3, 'hvac:fan-law-sp'),
          kind: 'input',
          prompt:
            `A blower develops ${sp1.toFixed(2)} in. w.c. at ${rpm1} RPM, and is sped up to ` +
            `${rpm2} RPM.\n\nWhat is the new static pressure, in in. w.c.?`,
          placeholder: 'in. w.c.',
          accept: [String(answer)],
    tolerance: Math.max(0.03, answer * 0.06),
          explain:
            `Second fan law: static pressure varies with the SQUARE of RPM. ` +
            `${sp1.toFixed(2)} × (${rpm2} ÷ ${rpm1})² = ${answer.toFixed(2)} in. w.c.\n\n` +
            `Speeding a blower up to force air through an undersized duct system raises static ` +
            `pressure faster than it raises airflow, which is why the fix for low airflow is ` +
            `almost always the duct, not the motor.`,
        };
      }

      const bhp1 = rng.int(25, 90) / 100;
      const answer = fanLaws.horsepower(bhp1, rpm1, rpm2);
      return {
        ...base(id, '6.0', '6.3', 3, 'hvac:fan-law-bhp'),
        kind: 'input',
        prompt:
          `A blower draws ${bhp1.toFixed(2)} BHP at ${rpm1} RPM, and is sped up to ${rpm2} RPM.\n\n` +
          `What is the new brake horsepower?`,
        placeholder: 'BHP',
        accept: [String(answer)],
    tolerance: Math.max(0.03, answer * 0.08),
        explain:
          `Third fan law: horsepower varies with the CUBE of RPM. ` +
          `${bhp1.toFixed(2)} × (${rpm2} ÷ ${rpm1})³ = ${answer.toFixed(2)} BHP.\n\n` +
          `Doubling airflow costs eight times the power. This is the law that burns out motors ` +
          `when somebody speeds a blower up to chase an airflow complaint.`,
      };
    }

    case 'tesp': {
      const supply = rng.int(15, 45) / 100;
      const ret = -rng.int(15, 45) / 100;
      const answer = totalExternalStatic(supply, ret);
      return {
        ...base(id, '6.0', '6.2', 2, 'hvac:tesp'),
        kind: 'input',
        prompt:
          `A manometer reads ${supply.toFixed(2)} in. w.c. in the supply plenum and ` +
          `${ret.toFixed(2)} in. w.c. in the return.\n\nWhat is the total external static pressure?`,
        placeholder: 'in. w.c.',
        accept: [String(answer)],
    tolerance: 0.03,
        explain:
          `TESP is the sum of the ABSOLUTE values: ${supply.toFixed(2)} + ${Math.abs(ret).toFixed(2)} = ` +
          `${answer.toFixed(2)} in. w.c.\n\n` +
          `The return reads negative because the blower is pulling on it. Adding the signed numbers ` +
          `instead of their magnitudes would cancel most of the reading and make a badly restricted ` +
          `system look fine. Most residential air handlers are rated for 0.50 in. w.c.; ` +
          `${answer.toFixed(2)} is ${answer > 0.5 ? 'above' : 'within'} that.`,
      };
    }

    case 'friction': {
      const available = rng.int(15, 40) / 100;
      const tel = rng.int(10, 30) * 10;
      const answer = frictionRate(available, tel);
      return {
        ...base(id, '6.0', '6.4', 3, 'hvac:friction-rate'),
        kind: 'input',
        prompt:
          `A duct design has ${available.toFixed(2)} in. w.c. of available static pressure and a ` +
          `total equivalent length of ${tel} ft.\n\nWhat is the friction rate, in in. w.c. per 100 ft?`,
        placeholder: 'in. w.c./100 ft',
        accept: [String(answer)],
    tolerance: 0.015,
        explain:
          `FR = (available static × 100) ÷ total equivalent length = ` +
          `(${available.toFixed(2)} × 100) ÷ ${tel} = ${answer.toFixed(3)} in. w.c. per 100 ft.\n\n` +
          `This is the number you take to the duct calculator. Equivalent length counts fittings ` +
          `as the straight duct they behave like — a hard elbow can be worth 30 or 40 feet, which ` +
          `is why a short run with many turns behaves like a long one.`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Electrical
// ---------------------------------------------------------------------------

function electricalDrill(rng: Rng, id: string): Question {
  const which = rng.pick(['ohms', 'power', 'series', 'parallel', 'capacitor'] as const);

  switch (which) {
    case 'ohms': {
      const volts = rng.pick([24, 120, 208, 240, 480]);
      const ohms = rng.int(4, 60);
      const answer = round1(volts / ohms);
      return {
        ...base(id, '5.0', '5.1', 1, 'hvac:ohms-law'),
        kind: 'input',
        prompt: `A ${ohms} Ω load is connected to ${volts} V.\n\nHow much current flows, in amps?`,
        placeholder: 'A',
        accept: [String(answer)],
    tolerance: Math.max(0.1, answer * 0.04),
        explain:
          `I = E ÷ R = ${volts} ÷ ${ohms} = ${answer} A.\n\n` +
          `The three forms are the same relationship rearranged: E = I × R, I = E ÷ R, R = E ÷ I. ` +
          `In the field the useful one is usually R = E ÷ I, because voltage and current are what a ` +
          `meter reads directly on a live circuit.`,
      };
    }

    case 'power': {
      const volts = rng.pick([120, 208, 240]);
      const amps = rng.int(3, 30);
      const answer = volts * amps;
      return {
        ...base(id, '5.0', '5.1', 1, 'hvac:power'),
        kind: 'input',
        prompt: `A single-phase load draws ${amps} A at ${volts} V.\n\nWhat is the power, in watts?`,
        placeholder: 'W',
        accept: [String(answer)],
    tolerance: Math.max(10, answer * 0.03),
        explain:
          `P = E × I = ${volts} × ${amps} = ${answer.toLocaleString()} W.\n\n` +
          `For a purely resistive load — electric heat, for instance — that is the whole story. ` +
          `Motors are inductive, so their real power is P = E × I × power factor, and the apparent ` +
          `power in VA is higher than the watts actually doing work.`,
      };
    }

    case 'series': {
      const r1 = rng.int(5, 40);
      const r2 = rng.int(5, 40);
      const r3 = rng.int(5, 40);
      const answer = r1 + r2 + r3;
      return {
        ...base(id, '5.0', '5.2', 2, 'hvac:series'),
        kind: 'input',
        prompt:
          `Three resistances of ${r1} Ω, ${r2} Ω and ${r3} Ω are wired in series.\n\n` +
          `What is the total resistance, in ohms?`,
        placeholder: 'Ω',
        accept: [String(answer)],
    tolerance: 1,
        explain:
          `In series, resistances add: ${r1} + ${r2} + ${r3} = ${answer} Ω.\n\n` +
          `Series is how safety controls are wired — every switch in the string has to close for ` +
          `the circuit to complete. That is also why measuring voltage across each device in turn ` +
          `finds an open one: the full supply voltage appears across whichever one is open.`,
      };
    }

    case 'parallel': {
      const r1 = rng.pick([10, 20, 30, 40, 60]);
      const r2 = rng.pick([10, 20, 30, 40, 60]);
      const answer = round1((r1 * r2) / (r1 + r2));
      return {
        ...base(id, '5.0', '5.2', 2, 'hvac:parallel'),
        kind: 'input',
        prompt:
          `Two resistances of ${r1} Ω and ${r2} Ω are wired in parallel.\n\n` +
          `What is the total resistance, in ohms?`,
        placeholder: 'Ω',
        accept: [String(answer)],
    tolerance: 0.6,
        explain:
          `For two in parallel, R = (R₁ × R₂) ÷ (R₁ + R₂) = (${r1} × ${r2}) ÷ ${r1 + r2} = ${answer} Ω.\n\n` +
          `Total resistance in parallel is always lower than the smallest branch, because each ` +
          `additional path gives current somewhere else to go. Loads in a piece of equipment are ` +
          `wired in parallel so each sees full voltage independently.`,
      };
    }

    case 'capacitor': {
      const rated = rng.pick([35, 40, 45, 50, 55, 60, 70]);
      const measured = round1(rated * (rng.int(70, 108) / 100));
      const percent = Math.round((measured / rated) * 100);
      const good = percent >= 94 && percent <= 106;
      const { choices, answer } = choicesFrom(
        rng,
        good ? 'Within tolerance — the capacitor is good' : 'Out of tolerance — replace the capacitor',
        [
          good ? 'Out of tolerance — replace the capacitor' : 'Within tolerance — the capacitor is good',
          'Cannot be judged without measuring the motor windings',
          'Cannot be judged without knowing the supply voltage',
        ],
        () => 'Retest after running the unit for an hour',
      );

      return {
        ...base(id, '5.0', '5.4', 2, 'hvac:capacitor-tolerance'),
        kind: 'choice',
        prompt:
          `A run capacitor rated ${rated} µF measures ${measured} µF on a capacitance meter.\n\n` +
          `What is your verdict?`,
        choices,
        answer,
        explain:
          `${measured} µF is ${percent}% of the ${rated} µF rating. Run capacitors are held to ±6%, ` +
          `so this one is ${good ? 'within' : 'outside'} tolerance.\n\n` +
          `A weak capacitor does not fail cleanly — the motor still tries to start, draws locked-rotor ` +
          `current, and trips on its overload. Intermittent hard-starting is very often a capacitor ` +
          `that has drifted rather than a failing motor. Always discharge one before handling it: a ` +
          `charged capacitor holds enough energy to hurt you well after the power is off.`,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

type Generator = (rng: Rng, id: string) => Question;

const GENERATORS: Record<Exclude<LabId, 'service-call'>, readonly Generator[]> = {
  'pt-chart': [ptLookup, ptReverse],
  'superheat-subcooling': [superheatCalc, subcoolingCalc, diagnoseFromReadings, targetSuperheat],
  psychrometrics: [psychrometricRead],
  'heat-load': [heatFormula],
  airflow: [airflowDrill],
  electrical: [electricalDrill],
};

export type DrillLabId = keyof typeof GENERATORS;

export function generateDrill(lab: DrillLabId, rng: Rng, count: number): Question[] {
  const generators = GENERATORS[lab];
  return Array.from({ length: count }, (_, i) => {
    const generator = i < generators.length ? generators[i]! : rng.pick(generators);
    return generator(rng, `hvac.${lab}.gen.${rng.seed}.${i}`);
  });
}

/** Every drill generator mixed together, for a full-track calculation workout. */
export function generateMixedDrill(rng: Rng, count: number): Question[] {
  const all = Object.values(GENERATORS).flat();
  return Array.from({ length: count }, (_, i) =>
    rng.pick(all)(rng, `hvac.mixed.gen.${rng.seed}.${i}`),
  );
}
