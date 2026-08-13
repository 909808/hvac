import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Fold the built app into one double-clickable HTML file.
 *
 * A normal Vite build is an index.html plus an assets folder, and browsers
 * refuse to load a module script from a `file://` page — so opening it straight
 * off the disk gives you a blank screen. Inlining the script and the stylesheet
 * removes the only two things that needed fetching, and the result opens by
 * double-clicking it like any other file.
 *
 * Run after `vite build`; see the `package` script in package.json.
 */

const DIST = 'dist';
const OUT = 'HVAC-Trainer.html';

const html = await readFile(join(DIST, 'index.html'), 'utf8');
const assets = await readdir(join(DIST, 'assets'));

const jsName = assets.find((f) => f.endsWith('.js'));
const cssName = assets.find((f) => f.endsWith('.css'));
if (!jsName) throw new Error('no built JS found in dist/assets — run `npm run build` first');

const js = await readFile(join(DIST, 'assets', jsName), 'utf8');
const css = cssName ? await readFile(join(DIST, 'assets', cssName), 'utf8') : '';

let out = html
  .replace(/\s*<script type="module"[^>]*><\/script>/, '')
  .replace(/\s*<link rel="stylesheet"[^>]*>/, '');

// `</script>` anywhere inside the bundle would close the tag early. It cannot
// appear in valid JS outside a string, and escaping the slash keeps the string
// identical at runtime.
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');

// The replacements MUST use functions, not strings.
//
// In `String.replace`, `$` in a replacement *string* is an escape: `$$` becomes
// a single `$`, `$&` becomes the match, and so on. The bundle is full of
// `` `$${money}` `` template literals, and passing it as a string quietly ate
// every currency symbol in the game — "$250" rendered as "250". A function
// replacer is inserted verbatim.
out = out.replace('</head>', () => `  <style>${css}</style>\n  </head>`);
out = out.replace('</body>', () => `  <script type="module">${safeJs}</script>\n  </body>`);

// Prove it, rather than trusting it. The bundle must survive byte for byte.
if (!out.includes(safeJs)) {
  throw new Error('the inlined script was altered during templating — refusing to write');
}
if (!css && cssName) throw new Error('stylesheet was found but came back empty');
if (css && !out.includes(css)) {
  throw new Error('the inlined stylesheet was altered during templating — refusing to write');
}

await writeFile(OUT, out, 'utf8');

const kb = Math.round(Buffer.byteLength(out) / 1024);
console.log(`\n  ${OUT} — ${kb} KB, self-contained.`);
console.log('  Double-click it, or drag it into a browser window.\n');
