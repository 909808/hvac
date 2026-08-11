import type { Question } from '@engine/types';

/**
 * HVAC controls content.
 *
 * Deliberately empty. The track is already wired into the app — pick it from
 * the track selector and the content audit will tell you it has no questions —
 * so adding material here is the only step needed to make it playable.
 *
 * Authoring works exactly as it does for Network+: see CONTENT_GUIDE.md, and
 * copy the shape of any file under `src/content/network-plus/`. The two things
 * to settle before writing much:
 *
 *   1. Which reference you are transcribing from. Register it in
 *      `src/content/books.ts` so citations can point at it. For controls work
 *      the obvious candidates are the ASHRAE Handbook (HVAC Applications,
 *      chapter on building automation), the manufacturer's sequence-of-operation
 *      documentation for the plant you actually work on, and BACnet's own
 *      ANSI/ASHRAE Standard 135 for anything protocol-related.
 *
 *   2. Whether the domain structure in `src/content/tracks.ts` matches how you
 *      think about the subject. Unlike N10-009, nothing external dictates it —
 *      that outline is a starting sketch, and it is worth reshaping before there
 *      is content filed against it.
 *
 * Protocol facts (BACnet object types, Modbus function codes, RS-485 limits)
 * are citable to standards the way the Network+ port table is, so those are the
 * items that can reach `verified` status quickly.
 */
export const HVAC_QUESTIONS: readonly Question[] = [];
