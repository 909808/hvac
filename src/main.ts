import { mount } from '@ui/app';
import { auditContent } from '@content/index';
import { formatReport } from '@engine/validate';
import './ui/styles.css';

// A structural fault in the content is worth shouting about during development —
// it means something in src/content/ is malformed, not merely unverified.
if (import.meta.env.DEV) {
  const report = auditContent();
  if (!report.ok) console.error(`Content validation failed:\n${formatReport(report)}`);
  else if (report.warnings.length > 0) console.warn(formatReport(report));
}

const root = document.getElementById('app');
if (!root) throw new Error('#app is missing from index.html');

mount(root);
