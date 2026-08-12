import { cite } from '@engine/define';
import { defineLesson, type Lesson } from '@engine/lesson';

/** Sector 1 — Fundamentals & Safety. */

const heatAndTemperature = defineLesson({
  id: 'hvac.lesson.1.heat',
  track: 'hvac',
  domain: '1.0',
  order: 1,
  title: 'Heat, temperature, and why they are not the same',
  summary:
    'The one distinction the whole trade rests on. Get it straight now and half the confusion ' +
    'later never happens.',
  minutes: 6,
  sections: [
    {
      kind: 'prose',
      body:
        'Temperature is how *fast* molecules are moving. Heat is how *much* thermal energy is ' +
        'there in total. They are different quantities measured in different units, and the ' +
        'difference matters constantly on the job.\n\n' +
        'A cup of boiling water is at 212°F. A bathtub of 100°F water is barely warm. But the ' +
        'bathtub contains vastly more heat, because heat depends on mass as well as temperature. ' +
        'Pour the cup into the tub and the tub gets slightly warmer — you moved a lot of ' +
        'temperature and very little heat.\n\n' +
        'Your thermostat reads temperature. Your equipment moves heat. When a customer says "it ' +
        'gets to 72 but the house still feels wrong", they are telling you something about heat ' +
        'and moisture that the temperature reading cannot express.',
    },
    {
      kind: 'keyNumbers',
      heading: 'Commit these to memory',
      items: [
        { label: 'One BTU', value: '1 lb of water, 1°F', note: 'The definition of the unit' },
        { label: 'One ton of cooling', value: '12,000 BTU/h', note: '2,000 lb ice ÷ 24 h' },
        { label: 'Specific heat of water', value: '1.0 BTU/lb·°F', note: 'Everything else is measured against this' },
        { label: 'Specific heat of air', value: '0.24 BTU/lb·°F', note: 'Air holds far less heat than water' },
        { label: 'Latent heat of fusion', value: '144 BTU/lb', note: 'Ice → water' },
        { label: 'Latent heat of vaporisation', value: '≈970 BTU/lb', note: 'Water → steam' },
      ],
    },
    {
      kind: 'prose',
      heading: 'Sensible versus latent',
      body:
        'Sensible heat changes temperature. You can feel it, and a thermometer reads it.\n\n' +
        'Latent heat changes *state* with no temperature change at all. Put a pan of 33°F ' +
        'ice-water on a burner and it sits at 32°F until every last piece of ice has melted — the ' +
        'burner is pouring energy in the whole time, and none of it raises the temperature. All ' +
        '144 BTU per pound go into breaking the bonds that make it a solid.\n\n' +
        'Compare the two numbers above and the significance jumps out. Raising a pound of water ' +
        'from 32°F to 212°F — the entire liquid range — takes 180 BTU. Boiling that same pound ' +
        'takes another 970. A change of state moves five times more energy than heating the ' +
        'liquid across its whole range.\n\n' +
        'That is why refrigeration works by boiling something. A system that merely warmed a fluid ' +
        'up would need an absurd amount of it. Boiling a refrigerant moves enormous heat through a ' +
        'small pipe, which is the entire trick.',
    },
    {
      kind: 'callout',
      tone: 'trap',
      heading: 'There is no such thing as "adding cold"',
      body:
        'Cold is the absence of heat, not a substance. An air conditioner does not send cold into ' +
        'a house — it removes heat from the house and dumps it outside.\n\n' +
        'This sounds pedantic until you are troubleshooting. Framing it correctly makes you ask ' +
        '"where is the heat going, and what is stopping it?" rather than "why is no cold coming ' +
        'out?" The first question has an answer you can measure.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: how much heat to cool a room?',
      problem:
        'You need to drop 1,000 lb of air from 78°F to 58°F, and it is dry enough that no moisture ' +
        'condenses.\n\nHow much heat must you remove?',
      steps: [
        {
          action: 'Identify what kind of heat this is. The temperature changes and there is no change of state.',
          result: 'Sensible heat only — no latent component.',
        },
        {
          action: 'Find the temperature change.',
          result: '78 − 58 = 20°F',
        },
        {
          action: 'Use Q = mass × specific heat × ΔT, with air at 0.24 BTU/lb·°F.',
          result: 'Q = 1,000 × 0.24 × 20',
        },
      ],
      answer: '4,800 BTU',
      moral:
        'Notice how little that is — a third of a ton-hour to cool half a ton of air by 20 degrees. ' +
        'Air carries very little heat, which is why systems must move so much of it. That is the ' +
        'physical reason 400 CFM per ton exists as a design number.',
    },
    {
      kind: 'prose',
      heading: 'Heat only moves one way',
      body:
        'Heat always flows from warmer to cooler, never the other way on its own. Every piece of ' +
        'equipment you will ever work on is an arrangement for exploiting that.\n\n' +
        'It moves three ways. **Conduction** is direct contact — heat through the copper wall of a ' +
        'tube. **Convection** is a fluid carrying it — a blower moving warm air across a coil. ' +
        '**Radiation** is electromagnetic — the sun loading a roof.\n\n' +
        'A coil is fundamentally a conduction device with convection on both sides: air to metal, ' +
        'metal to refrigerant. That is why fins exist, and why a dirty coil hurts so much — dirt ' +
        'is an insulator sitting exactly where conduction needs to happen.',
    },
  ],
  source: cite.standard('Standard thermodynamics; BTU and ton definitions are derivations'),
  status: 'verified',
}) satisfies Lesson;

const pressureAndSafety = defineLesson({
  id: 'hvac.lesson.1.pressure',
  track: 'hvac',
  domain: '1.0',
  order: 2,
  title: 'Pressure, vacuum, and staying alive',
  summary:
    'Gauge versus absolute, why evacuation is measured in microns, and the hazards that actually ' +
    'hurt people in this trade.',
  minutes: 7,
  sections: [
    {
      kind: 'prose',
      body:
        'Your manifold gauges read **gauge pressure** — psig — which measures relative to the air ' +
        'around you. At sea level, 0 psig means "same as the atmosphere", which is 14.7 psi of ' +
        'actual pressure.\n\n' +
        '**Absolute pressure** — psia — measures from a true vacuum. So psia = psig + 14.7.\n\n' +
        'For everyday charging and diagnosis, gauge pressure is what you want and the distinction ' +
        'never comes up. It matters enormously in one place: evacuation.',
    },
    {
      kind: 'keyNumbers',
      heading: 'Pressure reference',
      items: [
        { label: 'Atmospheric at sea level', value: '14.7 psia', note: '= 0 psig' },
        { label: 'Also written as', value: '29.92 in. Hg', note: 'Inches of mercury' },
        { label: 'Evacuation target', value: '500 microns', note: 'Absolute scale' },
        { label: 'Atmosphere in microns', value: '760,000', note: 'Shows how deep 500 really is' },
        { label: 'Moisture still boiling', value: '1,500–2,000', note: 'Where a wet system plateaus' },
      ],
    },
    {
      kind: 'prose',
      heading: 'Why a gauge cannot measure a vacuum',
      body:
        'Look at the numbers above. Atmospheric pressure is 760,000 microns. Your target is 500. ' +
        'The entire useful range of evacuation sits inside the last needle-width before 0 psig on ' +
        'a compound gauge.\n\n' +
        'A gauge simply cannot resolve it. "The needle is pegged at 29.9 inches" is compatible with ' +
        'a beautifully dry system and with one full of water. That is why a micron gauge is not ' +
        'optional equipment — it is the only instrument that can see the range that matters.',
    },
    {
      kind: 'worked',
      heading: 'Worked example: reading a decay test',
      problem:
        'You pull a system to 480 microns, valve off the pump, and watch. Over ten minutes the ' +
        'reading climbs to 1,800 microns and then holds steady there.\n\nWhat does that tell you?',
      steps: [
        {
          action: 'Ask first whether it rose at all. A truly dry, tight system holds near where you left it.',
          result: 'It rose, so something is going on.',
        },
        {
          action: 'Ask whether the rise levelled off or kept climbing. This is the diagnostic split.',
          result: 'It plateaued at 1,800 and stopped.',
        },
        {
          action: 'A plateau means a finite source that reaches equilibrium — moisture boiling off. A leak would keep pulling toward atmosphere without ever settling.',
          result: 'Finite source: water in the system.',
        },
      ],
      answer: 'Moisture, not a leak. Keep pumping — and consider gentle heat, since the moisture will not boil if the system is colder than the boiling point at that vacuum.',
      moral:
        'The decay test is the whole point of evacuation. Reaching 500 microns proves nothing on ' +
        'its own; *holding* 500 with the pump valved off is the actual test. Evacuating by the ' +
        'clock is how water gets sealed into systems.',
    },
    {
      kind: 'callout',
      tone: 'tip',
      heading: 'Vacuum does not suck water out',
      body:
        'It lowers the boiling point until the water boils at room temperature, and then the pump ' +
        'removes the vapour. Water boils at 212°F at atmospheric pressure and at roughly room ' +
        'temperature around 500 microns.\n\n' +
        'This is why a cold system evacuates so slowly, and why warming it gently does more than ' +
        'a bigger pump. If the ambient is below the boiling point at that vacuum, the moisture ' +
        'simply will not vaporise no matter how long you wait.',
    },
    {
      kind: 'callout',
      tone: 'warning',
      heading: 'The hazards that actually hurt people',
      body:
        '**Liquid refrigerant on skin** boils instantly and causes frostbite. Gloves and eye ' +
        'protection, every time you connect or disconnect.\n\n' +
        '**Vapour displaces oxygen.** Refrigerant is heavier than air and pools in basements, ' +
        'crawl spaces and pits. There is no smell to warn you. People have died in mechanical ' +
        'rooms this way.\n\n' +
        '**Never braze on a system with refrigerant in it.** Halogenated refrigerants passing ' +
        'through a flame break down into hydrogen fluoride and other acids.\n\n' +
        '**Never put oxygen in a refrigeration system.** Oxygen under pressure in contact with oil ' +
        'combusts violently. Use dry nitrogen with a regulator.\n\n' +
        '**Capacitors hold a charge** long after the disconnect opens. Discharge through a resistor ' +
        'before touching one.',
    },
    {
      kind: 'prose',
      heading: 'Live–dead–live',
      body:
        'Before working on anything electrical: test your meter on a known live source, test the ' +
        'circuit, then test your meter on the known live source again.\n\n' +
        'The second live test is the one people skip and the one that matters. A meter with a blown ' +
        'fuse, a flat battery or a broken lead reads zero volts on everything — including a circuit ' +
        'that is fully energised. Without that final check, "the meter read zero" and "the circuit ' +
        'is dead" are not the same statement.',
    },
  ],
  source: cite.standard('OSHA 29 CFR 1910.147; NFPA 70E; pressure–temperature relationship for water'),
  status: 'verified',
}) satisfies Lesson;

export const SECTOR_1_LESSONS: readonly Lesson[] = [heatAndTemperature, pressureAndSafety];
