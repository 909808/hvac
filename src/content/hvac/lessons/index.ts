import type { Lesson } from '@engine/lesson';
import { SECTOR_1_LESSONS } from './sector-1';
import { SECTOR_2_LESSONS } from './sector-2';
import { SECTOR_3_LESSONS } from './sector-3';
import { SECTOR_4_LESSONS } from './sector-4';
import { SECTOR_5_LESSONS } from './sector-5';
import { SECTOR_6_LESSONS } from './sector-6';
import { SECTOR_7_LESSONS } from './sector-7';
import { SECTOR_8_LESSONS } from './sector-8';
import { SECTOR_9_LESSONS } from './sector-9';
import { SECTOR_10_LESSONS } from './sector-10';

/**
 * The teaching content, one file per sector.
 *
 * A lesson is read before the sector's questions. Adding one means writing it
 * in the sector file and exporting it — the reader, the navigation and the
 * "Learn" button on the sector card all pick it up automatically.
 */
export const HVAC_LESSONS: readonly Lesson[] = [
  ...SECTOR_1_LESSONS,
  ...SECTOR_2_LESSONS,
  ...SECTOR_3_LESSONS,
  ...SECTOR_4_LESSONS,
  ...SECTOR_5_LESSONS,
  ...SECTOR_6_LESSONS,
  ...SECTOR_7_LESSONS,
  ...SECTOR_8_LESSONS,
  ...SECTOR_9_LESSONS,
  ...SECTOR_10_LESSONS,
];
