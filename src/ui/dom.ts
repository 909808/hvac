/** Minimal DOM helpers. No framework — the app is small enough not to need one. */

type Child = Node | string | number | null | undefined | false;

interface Props {
  class?: string;
  text?: string;
  html?: string;
  /** Anything else is set as an attribute, except `on*` which binds a listener. */
  [key: string]: unknown;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = String(value);
    else if (key === 'text') el.textContent = String(value);
    else if (key === 'html') el.innerHTML = String(value);
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }

  append(el, children);
  return el;
}

export function svg(tag: string, props: Record<string, string | number> = {}): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(props)) el.setAttribute(key, String(value));
  return el;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

/** Renders text with blank lines as paragraphs, preserving single newlines. */
export function paragraphs(text: string, className: string): HTMLElement {
  const wrap = h('div', { class: className });
  for (const block of text.split('\n\n')) {
    const p = h('p', { class: 'pre-line' });
    appendInline(p, block);
    wrap.appendChild(p);
  }
  return wrap;
}

/**
 * Minimal inline emphasis: `**bold**` and `*italic*`.
 *
 * Content is written as prose with the occasional emphasised term, and authors
 * reach for markdown by reflex. Rather than ban it, this renders the two forms
 * that actually get used.
 *
 * Built as DOM nodes rather than innerHTML — the content is ours, but there is
 * no reason to introduce an HTML injection path for the sake of two tags.
 */
export function appendInline(parent: Node, text: string): void {
  // Bold first so ** is not consumed by the single-asterisk rule.
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parent.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    if (match[1] !== undefined) {
      parent.appendChild(h('strong', { text: match[1] }));
    } else if (match[2] !== undefined) {
      parent.appendChild(h('em', { text: match[2] }));
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parent.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

/** A span with inline emphasis applied. */
export function inline(text: string, className?: string): HTMLElement {
  const el = h('span', className ? { class: className } : {});
  appendInline(el, text);
  return el;
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
