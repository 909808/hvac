import { describe, expect, it } from 'vitest';
import {
  FAULTS,
  MEASUREMENTS,
  derivedValues,
  measuredSubcooling,
  measuredSuperheat,
  simulate,
  takeMeasurement,
  type Conditions,
  type FaultId,
  type MeasurementId,
  type SystemSpec,
} from '../src/games/hvac/system';
import { pressureAt, saturationTemp, REFRIGERANTS } from '../src/games/hvac/refrigerant';

const TXV: SystemSpec = {
  refrigerant: 'R-410A',
  metering: 'txv',
  tons: 3,
  rla: 16,
  efficiency: 'standard',
};

const ORIFICE: SystemSpec = { ...TXV, metering: 'fixed-orifice' };

/** Design day: 95°F outside, 75/63 inside, correct airflow. */
const DESIGN: Conditions = {
  outdoorDryBulbF: 95,
  returnDryBulbF: 75,
  returnWetBulbF: 63,
  cfmPerTon: 400,
};

const healthy = simulate(TXV, DESIGN, 'none');

describe('healthy baseline', () => {
  it('lands inside every acceptance band', () => {
    expect(healthy.superheatF).toBeGreaterThanOrEqual(8);
    expect(healthy.superheatF).toBeLessThanOrEqual(12);
    expect(healthy.subcoolingF).toBeGreaterThanOrEqual(8);
    expect(healthy.subcoolingF).toBeLessThanOrEqual(12);
    expect(healthy.condenserSplitF).toBeGreaterThanOrEqual(20);
    expect(healthy.condenserSplitF).toBeLessThanOrEqual(30);
  });

  it('produces a believable evaporator temperature', () => {
    // 63°F wet bulb should put the coil in the low 40s.
    expect(healthy.evaporatorSatF).toBeGreaterThan(35);
    expect(healthy.evaporatorSatF).toBeLessThan(48);
  });

  it('reports every derived value as normal', () => {
    const all = new Set<MeasurementId>(MEASUREMENTS.map((m) => m.id));
    for (const derived of derivedValues(healthy, all)) {
      expect(derived.verdict, `${derived.id} = ${derived.value}`).toBe('normal');
    }
  });
});

describe('readings are self-consistent', () => {
  it('superheat recomputed from the gauges matches the model', () => {
    for (const f of FAULTS) {
      const state = simulate(TXV, DESIGN, f.id, 0.7);
      expect(measuredSuperheat(state), f.id).toBeCloseTo(state.superheatF, 0);
    }
  });

  it('subcooling recomputed from the gauges matches the model', () => {
    for (const f of FAULTS) {
      const state = simulate(TXV, DESIGN, f.id, 0.7);
      expect(measuredSubcooling(state), f.id).toBeCloseTo(state.subcoolingF, 0);
    }
  });

  it('never produces a negative superheat or subcooling', () => {
    for (const f of FAULTS) {
      for (const severity of [0.3, 0.6, 0.9, 1]) {
        for (const spec of [TXV, ORIFICE]) {
          const state = simulate(spec, DESIGN, f.id, severity);
          expect(state.superheatF, `${f.id} @ ${severity}`).toBeGreaterThanOrEqual(0);
          expect(state.subcoolingF, `${f.id} @ ${severity}`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('keeps supply air below return air', () => {
    for (const f of FAULTS) {
      const state = simulate(TXV, DESIGN, f.id, 0.8);
      expect(state.supplyDryBulbF, f.id).toBeLessThan(state.conditions.returnDryBulbF);
    }
  });
});

/**
 * The heart of the matter. Each fault must reproduce the signature a technician
 * is taught to recognise — if one of these flips, the simulator is teaching a
 * wrong diagnosis, which is far worse than teaching nothing.
 */
describe('fault signatures', () => {
  const at = (id: FaultId, spec = ORIFICE, severity = 0.8) =>
    simulate(spec, DESIGN, id, severity);
  const base = simulate(ORIFICE, DESIGN, 'none');

  it('undercharge: low suction, low head, HIGH superheat, LOW subcooling', () => {
    const s = at('undercharge');
    expect(s.suctionPsig).toBeLessThan(base.suctionPsig);
    expect(s.liquidPsig).toBeLessThan(base.liquidPsig);
    expect(s.superheatF).toBeGreaterThan(base.superheatF + 10);
    expect(s.subcoolingF).toBeLessThan(base.subcoolingF - 5);
  });

  it('overcharge: high head, LOW superheat, HIGH subcooling, high amps', () => {
    const s = at('overcharge');
    expect(s.liquidPsig).toBeGreaterThan(base.liquidPsig);
    expect(s.superheatF).toBeLessThan(base.superheatF);
    expect(s.subcoolingF).toBeGreaterThan(base.subcoolingF + 8);
    expect(s.compressorAmps).toBeGreaterThan(base.compressorAmps);
  });

  it('restriction: HIGH superheat AND HIGH subcooling — the pairing that names it', () => {
    const s = at('restricted-metering');
    expect(s.superheatF).toBeGreaterThan(base.superheatF + 10);
    expect(s.subcoolingF).toBeGreaterThan(base.subcoolingF + 5);
    expect(s.suctionPsig).toBeLessThan(base.suctionPsig);
  });

  it('undercharge and restriction differ only in subcooling', () => {
    // Both starve the coil. Subcooling is what separates them, and the sim must
    // make that separation unambiguous or the lesson does not land.
    const under = at('undercharge');
    const restricted = at('restricted-metering');
    expect(under.superheatF).toBeGreaterThan(base.superheatF + 10);
    expect(restricted.superheatF).toBeGreaterThan(base.superheatF + 10);
    expect(restricted.subcoolingF - under.subcoolingF).toBeGreaterThan(10);
  });

  it('dirty condenser: high head and high split, superheat roughly unchanged', () => {
    const s = at('dirty-condenser');
    expect(s.liquidPsig).toBeGreaterThan(base.liquidPsig);
    expect(s.condenserSplitF).toBeGreaterThan(30);
    expect(Math.abs(s.superheatF - base.superheatF)).toBeLessThan(5);
    expect(s.compressorAmps).toBeGreaterThan(base.compressorAmps);
  });

  it('failed condenser fan: an even more extreme split than a dirty coil', () => {
    expect(at('condenser-fan-failed').condenserSplitF).toBeGreaterThan(
      at('dirty-condenser').condenserSplitF,
    );
  });

  it('low airflow: low suction but the air-side drop goes UP', () => {
    const s = at('low-evaporator-airflow');
    expect(s.suctionPsig).toBeLessThan(base.suctionPsig);
    expect(s.evaporatorDeltaTF).toBeGreaterThan(base.evaporatorDeltaTF + 6);
  });

  it('low airflow and undercharge both drop suction, and delta-T tells them apart', () => {
    const airflow = at('low-evaporator-airflow');
    const under = at('undercharge');
    expect(airflow.suctionPsig).toBeLessThan(base.suctionPsig);
    expect(under.suctionPsig).toBeLessThan(base.suctionPsig);
    expect(airflow.evaporatorDeltaTF).toBeGreaterThan(under.evaporatorDeltaTF + 10);
  });

  it('bad compressor: pressures converge and amps fall', () => {
    const s = at('compressor-inefficient');
    expect(s.suctionPsig).toBeGreaterThan(base.suctionPsig);
    expect(s.liquidPsig).toBeLessThan(base.liquidPsig);
    expect(s.compressorAmps).toBeLessThan(base.compressorAmps * 0.8);
  });

  it('bad compressor is the only fault that pushes the pressures together', () => {
    const spread = (id: FaultId) => {
      const s = at(id);
      return s.liquidPsig - s.suctionPsig;
    };
    const baseSpread = base.liquidPsig - base.suctionPsig;
    expect(spread('compressor-inefficient')).toBeLessThan(baseSpread);
    expect(spread('overcharge')).toBeGreaterThan(baseSpread);
    expect(spread('dirty-condenser')).toBeGreaterThan(baseSpread);
    expect(spread('undercharge')).toBeLessThan(baseSpread * 1.05);
  });

  it('non-condensables: high split with a clean coil', () => {
    const s = at('non-condensables');
    expect(s.condenserSplitF).toBeGreaterThan(30);
    expect(takeMeasurement(s, 'condenser-inspect').value).toMatch(/clean/i);
  });

  it('TXV overfeeding: superheat collapses toward zero', () => {
    const s = at('txv-overfeeding', TXV, 0.9);
    expect(s.superheatF).toBeLessThan(4);
    expect(s.suctionPsig).toBeGreaterThan(simulate(TXV, DESIGN, 'none').suctionPsig);
  });

  it('gets worse as severity rises', () => {
    const mild = at('undercharge', ORIFICE, 0.3);
    const severe = at('undercharge', ORIFICE, 0.9);
    expect(severe.superheatF).toBeGreaterThan(mild.superheatF);
    expect(severe.subcoolingF).toBeLessThan(mild.subcoolingF);
  });
});

describe('metering device behaviour', () => {
  it('a TXV holds superheat far better than a fixed orifice under a mild undercharge', () => {
    const txv = simulate(TXV, DESIGN, 'undercharge', 0.4);
    const orifice = simulate(ORIFICE, DESIGN, 'undercharge', 0.4);
    const txvRise = txv.superheatF - simulate(TXV, DESIGN, 'none').superheatF;
    const orificeRise = orifice.superheatF - simulate(ORIFICE, DESIGN, 'none').superheatF;
    expect(txvRise).toBeLessThan(orificeRise);
  });

  it('still loses control of superheat once the undercharge is severe', () => {
    const mild = simulate(TXV, DESIGN, 'undercharge', 0.3);
    const severe = simulate(TXV, DESIGN, 'undercharge', 1);
    expect(severe.superheatF).toBeGreaterThan(mild.superheatF + 8);
  });
});

describe('measurements', () => {
  it('returns a value for every defined measurement and fault', () => {
    for (const f of FAULTS) {
      const state = simulate(TXV, DESIGN, f.id, 0.7);
      for (const m of MEASUREMENTS) {
        const reading = takeMeasurement(state, m.id);
        expect(reading.value, `${f.id}/${m.id}`).toBeTruthy();
      }
    }
  });

  it('shows a loaded filter only when airflow is the fault', () => {
    for (const f of FAULTS) {
      const state = simulate(TXV, DESIGN, f.id, 0.8);
      const filter = takeMeasurement(state, 'filter-inspect').value;
      if (f.id === 'low-evaporator-airflow') expect(filter).toMatch(/loaded/i);
      else expect(filter).toMatch(/clean/i);
    }
  });

  it('names every key measurement as one that actually exists', () => {
    const ids = new Set(MEASUREMENTS.map((m) => m.id));
    for (const f of FAULTS) {
      for (const key of f.keyMeasurements) {
        expect(ids.has(key), `${f.id} names unknown measurement ${key}`).toBe(true);
      }
    }
  });

  it('only references faults that exist in confusedWith', () => {
    const ids = new Set(FAULTS.map((f) => f.id));
    for (const f of FAULTS) {
      for (const other of f.confusedWith) {
        expect(ids.has(other), `${f.id} references unknown fault ${other}`).toBe(true);
        expect(other, `${f.id} lists itself`).not.toBe(f.id);
      }
    }
  });
});

describe('refrigerant tables', () => {
  it('rises monotonically with temperature', () => {
    for (const r of REFRIGERANTS) {
      for (let i = 1; i < r.curve.length; i++) {
        expect(r.curve[i]![0], r.id).toBeGreaterThan(r.curve[i - 1]![0]);
        expect(r.curve[i]![1], r.id).toBeGreaterThan(r.curve[i - 1]![1]);
      }
    }
  });

  it('hits the anchor points every technician knows', () => {
    // R-22 at 40°F is 68.5 psig; R-410A at 40°F is about 118 psig.
    expect(pressureAt('R-22', 40)).toBeCloseTo(68.5, 0);
    expect(pressureAt('R-410A', 40)).toBeCloseTo(118.5, 0);
    expect(pressureAt('R-134a', 40)).toBeCloseTo(35.0, 0);
    expect(pressureAt('R-410A', 100)).toBeCloseTo(317, 0);
  });

  it('round-trips pressure and temperature', () => {
    for (const r of REFRIGERANTS) {
      for (let t = -20; t <= 120; t += 5) {
        const p = pressureAt(r.id, t);
        expect(saturationTemp(r.id, p), `${r.id} @ ${t}°F`).toBeCloseTo(t, 0);
      }
    }
  });

  it('interpolates between table rows', () => {
    const at40 = pressureAt('R-410A', 40);
    const at50 = pressureAt('R-410A', 50);
    const at45 = pressureAt('R-410A', 45);
    expect(at45).toBeGreaterThan(at40);
    expect(at45).toBeLessThan(at50);
  });

  it('clamps rather than extrapolating past the table', () => {
    const r = REFRIGERANTS[0]!;
    const coldest = r.curve[0]!;
    const hottest = r.curve[r.curve.length - 1]!;
    expect(pressureAt(r.id, -200)).toBe(coldest[1]);
    expect(pressureAt(r.id, 500)).toBe(hottest[1]);
  });
});
