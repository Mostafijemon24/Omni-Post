import type { CSSProperties } from "react";

const cache = new Map<string, CSSProperties>();

/** Split on `;` that are not inside parentheses or quotes. */
function declarations(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let cur = "";
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Parse a CSS declaration string into a React style object (memoised).
 * The ported design screens keep their exact inline declarations; later
 * declarations override earlier ones, as in CSS.
 */
export function css(text: string): CSSProperties {
  const hit = cache.get(text);
  if (hit) return hit;
  const style: Record<string, string> = {};
  for (const decl of declarations(text)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop || !value) continue;
    const key = prop.startsWith("--")
      ? prop
      : prop.replace(/^-(webkit|moz|ms)-/, (_, p: string) => p[0].toUpperCase() + p.slice(1) + "-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    delete style[key];
    style[key] = value;
  }
  cache.set(text, style as CSSProperties);
  return style as CSSProperties;
}
