import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

/** Sector 3 — Refrigerants & EPA 608. */

const refrigerants = defineLesson({
  id: 'hvac.lesson.3.refrigerants',
  track: 'hvac',
  domain: '3.0',
  order: 1,
  title: 'What is actually in the system',
  summary: 'Families, blends, oils, and why moisture is the enemy that quietly kills compressors.',
  minutes: 7,
  sections: [
    {
      kind: 'prose',
      body:
        'Refrigerant families are defined by what is in the molecule, and the history of the trade ' +
        'is largely a history of taking things out of it.\n\n' +
        '**Chlorine** destroys ozone. CFCs like R-12 had the most and went first. HCFCs like R-22 ' +
        'had less and were phased out of new equipment by 2010, with virgin production ending in ' +
        '2020. HFCs like R-410A and R-134a have none at all.\n\n' +
        'The current pressure is different: HFCs have high **global warming potential**, so the ' +
        'move now is toward lower-GWP alternatives and HFO blends. Same pattern, different ' +
        'environmental concern.',
    },
    {
      kind: 'table',
      heading: 'The ones you will meet',
      columns: ['Refrigerant', 'Family', 'Oil', 'Where'],
      rows: [
        ['R-22', 'HCFC', 'Mineral', 'Legacy residential and light commercial'],
        ['R-410A', 'HFC blend', 'POE', 'Most residential equipment since the 2000s'],
        ['R-134a', 'HFC', 'POE', 'Chillers, automotive, commercial refrigeration'],
        ['R-404A', 'HFC blend', 'POE', 'Low/medium-temp commercial refrigeration'],
        ['R-717', 'Ammonia', 'Mineral', 'Large industrial plant'],
      ],
      note:
        'R-410A runs at roughly 60% higher pressure than R-22. It needs its own gauges, and the ' +
        'two are not interchangeable in any sense.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'Charge a blend as a LIQUID',
      body:
        'R-410A and R-404A are blends of components with different boiling points. Draw vapour off ' +
        'the top of the cylinder and the more volatile component leaves preferentially — so what ' +
        'goes into the system is no longer the blend on the label, and what stays in the cylinder ' +
        'is not either.\n\n' +
        'Charge liquid, metered slowly into the suction line through a restrictor, or into the ' +
        'high side with the system off.\n\n' +
        'Same logic: a leaking blend system should be recovered and recharged, not topped up. What ' +
        'leaked out may not have matched the label.',
    },
    {
      kind: 'prose',
      heading: 'POE oil and the moisture problem',
      body:
        'HFC systems use POE (polyolester) oil, because mineral oil will not return through the ' +
        'system with them. POE has one property that shapes how you work: it is strongly ' +
        '**hygroscopic**. It pulls water out of the air fast, and it does not give it back easily.\n\n' +
        'Water plus POE produces acid. Acid attacks motor windings and eventually takes out the ' +
        'compressor — months later, so the connection to the sloppy repair that caused it is ' +
        'usually never made.\n\n' +
        'The practical rules follow directly: cap lines immediately, keep POE containers sealed, ' +
        'purge with nitrogen while brazing, and evacuate to 500 microns with a decay test rather ' +
        'than by the clock.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Nitrogen while brazing, always',
      body:
        'Heating copper with air inside produces black flaky oxide scale on the inner wall. It ' +
        'breaks loose once the system runs, travels with the refrigerant, and plugs metering ' +
        'devices and driers.\n\n' +
        'A gentle nitrogen flow — a few CFH, enough to displace air, not enough to blow the molten ' +
        'braze out — leaves the joint bright inside. You get one chance; scale cannot be cleaned ' +
        'out afterwards.',
    },
  ],
  source: cite.todo('Confirm the refrigerant families and oil compatibility against your text.'),
  status: 'draft',
}) satisfies Lesson;

const epa608 = defineLesson({
  id: 'hvac.lesson.3.epa',
  track: 'hvac',
  domain: '3.0',
  order: 2,
  title: 'EPA 608: the rules that are actually law',
  summary:
    'Certification types, the three Rs, cylinder handling, and the venting prohibition. This is ' +
    'regulation, not opinion.',
  minutes: 6,
  sections: [
    {
      kind: 'prose',
      body:
        'Section 608 of the Clean Air Act governs how refrigerant is handled. The rules live in ' +
        '40 CFR Part 82, Subpart F, which is free to read online and is what the certification ' +
        'exam is drawn from.\n\n' +
        'The core prohibition is simple: **knowingly venting refrigerant during maintenance, ' +
        'service, repair or disposal is illegal.** It applies to HFCs as well as the older ' +
        'ozone-depleting refrigerants.',
    },
    {
      kind: 'table',
      heading: 'Certification types',
      columns: ['Type', 'Covers', 'Typical equipment'],
      rows: [
        ['Core', 'Prerequisite for all — science, regs, safety', 'Certifies you for nothing alone'],
        ['Type I', 'Small appliances, factory-charged with ≤5 lb', 'Domestic fridges, window units'],
        ['Type II', 'High and very high pressure', 'Most residential and light commercial'],
        ['Type III', 'Low pressure', 'Centrifugal chillers'],
        ['Universal', 'All three type sections', 'Everything'],
      ],
      note: 'Certification does not expire. Refrigerant sales are restricted to certified technicians.',
    },
    {
      kind: 'keyNumbers',
      heading: 'Numbers the exam asks for',
      items: [
        { label: 'Recovery cylinder fill limit', value: '80% by weight', note: 'Leaves vapour space for expansion' },
        { label: 'Evacuation target', value: '500 microns', note: 'With a decay test' },
        { label: 'Type I threshold', value: '5 lb', note: 'Factory-charged small appliances' },
        { label: 'Reclaim standard', value: 'ARI-700', note: 'Virgin specification, verified by analysis' },
      ],
    },
    {
      kind: 'prose',
      heading: 'Recover, recycle, reclaim',
      body:
        'These three are a ladder of how thoroughly refrigerant is cleaned, and the distinction has ' +
        'legal weight.\n\n' +
        '**Recover** — remove it from the system into a container. No processing.\n\n' +
        '**Recycle** — clean it in the field: oil separation and filter-drying.\n\n' +
        '**Reclaim** — reprocess to virgin specification and verify by chemical analysis at a ' +
        'licensed facility.\n\n' +
        'Recovered refrigerant may go back into the same system, or one owned by the same person. ' +
        'Refrigerant sold to a **different owner** must be reclaimed. Field recycling is not enough ' +
        'for that.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'Why 80% on a cylinder',
      body:
        'Liquids are nearly incompressible. A cylinder filled solid with liquid that then warms in ' +
        'a hot van has no vapour space to absorb the expansion, and hydrostatic pressure rises ' +
        'catastrophically — far past the relief setting, fast.\n\n' +
        'Fill **by weight on a scale.** A pressure gauge cannot tell you how full a cylinder is, ' +
        'because pressure only reflects temperature while any liquid remains.\n\n' +
        'Never refill a disposable cylinder. Never mix refrigerants in a recovery cylinder — a ' +
        'mixed cylinder cannot be reclaimed and becomes disposal.',
    },
  ],
  source: cite.standard('40 CFR Part 82, Subpart F — §82.154, §82.156, §82.161, §82.164'),
  status: 'verified',
}) satisfies Lesson;

export const SECTOR_3_LESSONS: readonly Lesson[] = [refrigerants, epa608];
