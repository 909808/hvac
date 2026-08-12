import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';
import type { Topology } from '@engine/types';

/** Sector 8 — Heating: Furnaces & Boilers. */

const furnaceChain: Topology = {
  caption: 'The safety chain: each step must prove itself before the next is allowed',
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

const combustionAndFurnaces = defineLesson({
  id: 'hvac.lesson.8.furnace',
  track: 'hvac',
  domain: '8.0',
  order: 1,
  title: 'Combustion and the furnace sequence',
  summary:
    'Every step in a furnace start-up exists to prove something before the next step is allowed. ' +
    'Learn the chain and most no-heat calls diagnose themselves.',
  minutes: 8,
  sections: [
    {
      kind: 'prose',
      body:
        'Combustion needs three things: **fuel, oxygen, heat**. Remove any one and it stops — which ' +
        'is the basis of every safety control on a fired appliance.\n\n' +
        'Complete combustion of natural gas produces carbon dioxide and water vapour. **Incomplete** ' +
        'combustion, usually from insufficient air, produces carbon monoxide. That is what makes ' +
        'combustion air a life-safety issue rather than an efficiency one.',
    },
    {
      kind: 'keyNumbers',
      heading: 'Fuel numbers',
      items: [
        { label: 'Natural gas heating value', value: '≈1,000 BTU/ft³', note: 'Verify with the utility' },
        { label: 'Natural gas manifold', value: '≈3.5 in. w.c.', note: 'Check the data plate' },
        { label: 'Propane heating value', value: '≈2,500 BTU/ft³', note: 'Much denser' },
        { label: 'Propane manifold', value: '≈11 in. w.c.', note: 'Not interchangeable with NG' },
        { label: 'Thermocouple output', value: '25–30 mV', note: 'In the pilot flame' },
      ],
    },
    {
      kind: 'diagram',
      topology: furnaceChain,
    },
    {
      kind: 'prose',
      heading: 'The sequence, and why it is in that order',
      body:
        '1. **Thermostat closes** on a call for heat.\n' +
        '2. **Inducer starts** and purges the heat exchanger of any residual gas.\n' +
        '3. **Pressure switch proves** the inducer is actually moving air, and closes.\n' +
        '4. **Igniter energises** and reaches ignition temperature.\n' +
        '5. **Gas valve opens** and the burners light.\n' +
        '6. **Flame sensor proves flame** within the trial-for-ignition period.\n' +
        '7. **Blower starts** after the fan-on delay.\n' +
        '8. On satisfying the thermostat, **gas valve closes** and the blower runs out its off delay.\n\n' +
        'Every step is a proof. The inducer proves itself through the pressure switch *before* gas ' +
        'is introduced, so gas never enters without a proven path for the flue products. The igniter ' +
        'is hot *before* the valve opens, so gas never accumulates unlit.\n\n' +
        'The blower delays are comfort and efficiency: on-delay stops it blowing cold air, off-delay ' +
        'scavenges the remaining heat out of the exchanger.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: lights, then drops out',
      problem:
        'A furnace lights, runs about five seconds, shuts off, retries twice more, then locks out.\n\n' +
        'Where in the sequence is it failing?',
      steps: [
        {
          action: 'Note what succeeded. The burners lit at all.',
          result: 'Steps 1–5 all worked: thermostat, inducer, pressure switch, igniter, gas valve.',
        },
        {
          action: 'Note what failed. It shut down a few seconds after lighting, and retried.',
          result: 'Step 6 — flame proving. The board did not see flame, so it closed the valve.',
        },
        {
          action: 'Recall how flame proving works. Rectification passes microamps from the sensor through the flame to the grounded burner.',
          result: 'Anything blocking that tiny current looks like "no flame".',
        },
        {
          action: 'List what blocks it.',
          result: 'Oxide film on the sensor, or a poor burner ground.',
        },
      ],
      answer:
        'Flame proving. Clean the flame sensor with fine abrasive and confirm the burner ground. A ' +
        'microamp reading tells you definitively.',
      moral:
        'One observation — "it lights then drops out" — eliminated five of the six steps. That is ' +
        'what knowing the sequence buys you.',
    },
    {
      kind: 'prose',
      heading: 'Condensing furnaces',
      body:
        'Burning gas produces water vapour, and that vapour carries a lot of latent heat. A ' +
        'conventional furnace sends it up the flue still as vapour, and the heat goes with it.\n\n' +
        'A condensing furnace adds a **second heat exchanger** that drops flue gas below its dew ' +
        'point. The vapour condenses, releasing its latent heat into the airstream — which is what ' +
        'takes AFUE past 90%.\n\n' +
        'The consequences are practical. The condensate is mildly acidic, so the secondary exchanger ' +
        'is stainless or aluminium and the drain must be handled properly. Flue gas is cool enough ' +
        'to vent in PVC — and it *must* be, since it will not rise up a masonry chimney.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'The most common condensing-furnace no-heat call',
      body:
        'A blocked condensate drain. The water backs up, the pressure switch senses it, and the ' +
        'furnace refuses to run.\n\n' +
        'It presents as a furnace that will not start, and the fix is a drain cleaning. Check it ' +
        'before you get deep into the sequence.',
    },
    {
      kind: 'table',
      heading: 'Vent categories',
      columns: ['Category', 'Vent pressure', 'Condensing?', 'Typical'],
      rows: [
        ['I', 'Negative', 'No', 'Natural draft, most induced draft'],
        ['II', 'Negative', 'Yes', 'Uncommon'],
        ['III', 'Positive', 'No', 'Some commercial'],
        ['IV', 'Positive', 'Yes', 'High-efficiency furnaces in PVC'],
      ],
      note:
        'Two variables give four combinations. A Category I appliance relies on buoyancy and needs ' +
        'a vent that will draft. A Category IV is pushed by its inducer and its vent must be sealed, ' +
        'because it is under positive pressure inside a living space.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Backdrafting',
      body:
        'Exhaust fans remove air from a house, and that air has to be replaced. In a tight house ' +
        'with a natural-draft appliance in a sealed closet, the path of least resistance can be ' +
        '**back down the flue** — reversing the draft and spilling combustion products, including ' +
        'carbon monoxide, into the space.\n\n' +
        'The test is a worst-case depressurisation check: run every exhaust appliance in the house ' +
        'and confirm the flue still drafts.\n\n' +
        'This is why combustion air openings are sized and required, and why sealed-combustion ' +
        'appliances that draw their air directly from outdoors are the modern answer.',
    },
  ],
  source: cite.todo('Confirm the sequence, fuel values and vent categories against your text and the applicable fuel gas code.'),
  status: 'draft',
}) satisfies Lesson;

export const SECTOR_8_LESSONS: readonly Lesson[] = [combustionAndFurnaces];
