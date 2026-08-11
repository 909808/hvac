import { defineBook } from '@engine/define';
import type { BookRef } from '@engine/types';

/**
 * The books this content is transcribed from.
 *
 * Register a book here before citing it — the validator rejects a citation to
 * an unknown book id, which stops a typo in a `book:` field from quietly
 * producing an uncheckable claim.
 *
 * ISBNs and editions below were checked against publisher and retailer listings
 * in August 2026. If you buy a different printing, update `edition` and `isbn13`
 * so page citations stay meaningful — page numbers move between printings.
 */

export const MEYERS_9E = defineBook({
  id: 'meyers-9e',
  title: 'CompTIA Network+ Certification All-in-One Exam Guide, Ninth Edition (Exam N10-009)',
  authors: ['Jonathan S. Weissman', 'Mike Meyers'],
  edition: '9th',
  isbn13: '9780981621739',
  publisher: 'Total Seminars',
  targets: 'N10-009',
});

export const LAMMLE_6E = defineBook({
  id: 'lammle-6e',
  title: 'CompTIA Network+ Study Guide: Exam N10-009',
  authors: ['Todd Lammle', 'Jon Buhagiar'],
  edition: '6th',
  isbn13: '9781394235605',
  publisher: 'Sybex',
  targets: 'N10-009',
});

export const SEQUEIRA_2E = defineBook({
  id: 'sequeira-2e',
  title: 'CompTIA Network+ N10-009 Cert Guide',
  authors: ['Anthony Sequeira'],
  edition: '2nd',
  isbn13: '9780135367889',
  publisher: 'Pearson IT Certification',
  targets: 'N10-009',
});

export const ZACKER_PRACTICE_3E = defineBook({
  id: 'zacker-practice-3e',
  title: 'CompTIA Network+ Practice Tests: Exam N10-009',
  authors: ['Craig Zacker'],
  edition: '3rd',
  isbn13: '9781394239290',
  publisher: 'Sybex',
  targets: 'N10-009',
});

export const DULANEY_CRAM = defineBook({
  id: 'dulaney-cram',
  title: 'CompTIA Network+ N10-009 Exam Cram',
  authors: ['Emmett Dulaney'],
  edition: '7th',
  isbn13: '9780135340837',
  publisher: 'Pearson IT Certification',
  targets: 'N10-009',
});

export const BOOKS: readonly BookRef[] = [
  MEYERS_9E,
  LAMMLE_6E,
  SEQUEIRA_2E,
  ZACKER_PRACTICE_3E,
  DULANEY_CRAM,
];
