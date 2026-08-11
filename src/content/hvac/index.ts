import type { Question } from '@engine/types';
import { SECTOR_1_QUESTIONS } from './sector-1-fundamentals';
import { SECTOR_2_QUESTIONS } from './sector-2-cycle';
import { SECTOR_3_QUESTIONS } from './sector-3-refrigerants';
import { SECTOR_4_QUESTIONS } from './sector-4-charging';
import { SECTOR_5_QUESTIONS } from './sector-5-electrical';
import { SECTOR_6_QUESTIONS } from './sector-6-airflow';
import { SECTOR_7_QUESTIONS } from './sector-7-psychrometrics';
import { SECTOR_8_QUESTIONS } from './sector-8-heating';
import { SECTOR_9_QUESTIONS } from './sector-9-heatpumps';
import { SECTOR_10_QUESTIONS } from './sector-10-diagnostics';

/**
 * HVAC content, one file per sector.
 *
 * To add a sector's worth of material, edit the matching file — nothing else
 * needs changing. To add a whole new sector, add it to `src/content/tracks.ts`
 * and import its questions here.
 *
 * Status discipline is the same as the Network+ track: items citing a standard,
 * a regulation or a derivation are `verified`; items that are study-guide
 * framings carry `cite.todo` and stay `draft` until you check them against a
 * text and add the page. The Content Audit screen lists every outstanding one.
 */
export const HVAC_QUESTIONS: readonly Question[] = [
  ...SECTOR_1_QUESTIONS,
  ...SECTOR_2_QUESTIONS,
  ...SECTOR_3_QUESTIONS,
  ...SECTOR_4_QUESTIONS,
  ...SECTOR_5_QUESTIONS,
  ...SECTOR_6_QUESTIONS,
  ...SECTOR_7_QUESTIONS,
  ...SECTOR_8_QUESTIONS,
  ...SECTOR_9_QUESTIONS,
  ...SECTOR_10_QUESTIONS,
];
