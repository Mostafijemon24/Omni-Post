#!/usr/bin/env node
/**
 * dc2tsx — one-way port of the design template (`design/OmniPost AI.dc.html`)
 * into typed React screen components.
 *
 * The design template is declarative: `<sc-for>`, `<sc-if>`, `{{ path }}` bindings,
 * inline styles and `style-hover` / `style-focus`. This tool maps that 1:1 onto JSX so
 * the implemented screens keep the exact dimensions, colours and layout of the design.
 *
 *   node tools/dc2tsx.mjs            # regenerate src/screens/*.tsx + src/styles/dc-states.css
 *   node tools/dc2tsx.mjs --shell    # also print the app shell JSX to stdout (reference only)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "htmlparser2";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "../../design/OmniPost AI.dc.html");
const OUT_SCREENS = resolve(here, "../src/screens");
const OUT_CSS = resolve(here, "../src/styles/dc-states.css");

const html = readFileSync(SRC, "utf8");
const open = html.indexOf("<x-dc>");
const close = html.lastIndexOf("</x-dc>");
const template = html.slice(open + "<x-dc>".length, close).replace(/<helmet>[\s\S]*?<\/helmet>/, "");

const doc = parseDocument(template, { lowerCaseAttributeNames: false, lowerCaseTags: true, decodeEntities: true });

const VOID = new Set(["br", "input", "img", "hr"]);
const ATTR_MAP = { class: "className", for: "htmlFor", autocomplete: "autoComplete", onClick: "onClick", onChange: "onChange" };
const stateRules = new Map(); // css text -> class name

function stateClass(kind, css) {
  const key = kind + "|" + css;
  if (!stateRules.has(key)) stateRules.set(key, `dc-${kind[0]}${stateRules.size + 1}`);
  return stateRules.get(key);
}

/** `a.b.c` -> scoped JS expression with optional chaining. */
function expr(path, scope) {
  const parts = path.trim().split(".");
  if (!/^[A-Za-z_$][\w$]*$/.test(parts[0])) throw new Error("unsupported expression: " + path);
  if (parts[0] === "true" || parts[0] === "false") return parts[0];
  const root = scope.has(parts[0]) ? parts[0] : "v." + parts[0];
  return [root, ...parts.slice(1)].join(".");
}

const BIND = /\{\{([^}]*)\}\}/g;

/** Attribute value -> JS expression (string literal, single binding, or template literal). */
function attrExpr(value, scope) {
  const single = /^\s*\{\{([^}]*)\}\}\s*$/.exec(value);
  if (single) return { code: expr(single[1], scope), dynamic: true, single: true };
  if (!BIND.test(value)) return { code: JSON.stringify(value), dynamic: false };
  BIND.lastIndex = 0;
  const body = value
    .replace(/[`\\]/g, "\\$&")
    .replace(/\$\{/g, "\\${")
    .replace(BIND, (_, p) => "${" + expr(p, scope) + "}");
  return { code: "`" + body + "`", dynamic: true };
}

function textJsx(raw, scope, pre) {
  let text = raw;
  if (!pre) text = text.replace(/\s+/g, " ");
  if (text === "") return "";
  const out = [];
  let last = 0;
  BIND.lastIndex = 0;
  let m;
  const lit = (s) => (s ? out.push(/^[^{}<>&\n\\]+$/.test(s) && s.trim() === s ? s : `{${JSON.stringify(s)}}`) : 0);
  while ((m = BIND.exec(text))) {
    lit(text.slice(last, m.index));
    out.push(`{${expr(m[1], scope)}}`);
    last = m.index + m[0].length;
  }
  lit(text.slice(last));
  return out.join("");
}

const isLayoutBox = (el) => /display:\s*(flex|grid|inline-flex)/.test(el?.attribs?.style || "");

/** Fixed multi-column grids get a class so they can stack on narrow viewports. */
function stackable(style) {
  const m = /grid-template-columns:\s*([^;]+)/.exec(style || "");
  if (!m || /repeat|auto-fi|\{\{/.test(m[1])) return false;
  const tracks = m[1].trim().split(/\s+/);
  return tracks.length >= 2 && tracks.length <= 4;
}

function render(node, scope, ind, ctx) {
  const pad = "  ".repeat(ind);
  if (node.type === "comment") return "";
  if (node.type === "text") {
    if (!ctx.pre && /^\s*$/.test(node.data)) {
      // Whitespace between siblings only matters in inline flow.
      if (!node.prev || !node.next || isLayoutBox(node.parent)) return "";
      return `${pad}{" "}\n`;
    }
    const t = textJsx(node.data, scope, ctx.pre);
    return t ? `${pad}${t}\n` : "";
  }
  if (node.type !== "tag") return "";

  const kids = (sc, c = ctx, i = ind + 1) => node.children.map((ch) => render(ch, sc, i, c)).join("");

  if (node.name === "sc-for") {
    const as = node.attribs.as;
    const list = expr(/\{\{([^}]*)\}\}/.exec(node.attribs.list)[1], scope);
    const inner = new Set(scope).add(as);
    const idx = `${as}I`;
    return `${pad}{(${list} ?? []).map((${as}: any, ${idx}: number) => (\n${pad}  <Fragment key={${idx}}>\n${kids(inner, ctx, ind + 2)}${pad}  </Fragment>\n${pad}))}\n`;
  }
  if (node.name === "sc-if") {
    const cond = expr(/\{\{([^}]*)\}\}/.exec(node.attribs.value)[1], scope);
    return `${pad}{${cond} ? (\n${pad}  <>\n${kids(scope, ctx, ind + 2)}${pad}  </>\n${pad}) : null}\n`;
  }

  const attrs = [];
  const classes = [];
  let classDyn = null;
  const a = node.attribs;
  for (const [name, value] of Object.entries(a)) {
    if (name.startsWith("hint-")) continue;
    if (name === "style") {
      const e = attrExpr(value, scope);
      attrs.push(`style={css(${e.code})}`);
      if (stackable(value)) classes.push("om-stack");
    } else if (name === "style-hover" || name === "style-focus") {
      classes.push(stateClass(name.slice(6), value.trim()));
    } else if (name === "class") {
      const e = attrExpr(value, scope);
      if (e.dynamic) classDyn = e.code;
      else classes.push(value);
    } else if (name === "onClick" || name === "onChange") {
      const fn = expr(/\{\{([^}]*)\}\}/.exec(value)[1], scope);
      if (node.name === "a") attrs.push(`${name}={(e) => { e.preventDefault(); ${fn}?.(); }}`);
      else attrs.push(`${name}={${fn}}`);
    } else if (name === "value" && node.name === "input") {
      attrs.push(`value={${attrExpr(value, scope).code} ?? ""}`);
    } else {
      const e = attrExpr(value, scope);
      attrs.push(`${ATTR_MAP[name] || name}=${e.dynamic ? `{${e.code}}` : JSON.stringify(value)}`);
    }
  }
  if (classDyn && classes.length) attrs.unshift(`className={${JSON.stringify(classes.join(" ") + " ")} + ${classDyn}}`);
  else if (classDyn) attrs.unshift(`className={${classDyn}}`);
  else if (classes.length) attrs.unshift(`className=${JSON.stringify(classes.join(" "))}`);
  if (node.name === "input" && a.value !== undefined && a.onChange === undefined) attrs.push("readOnly");
  if (node.name === "button" && !a.type) attrs.push('type="button"');

  const head = `${pad}<${node.name}${attrs.length ? " " + attrs.join(" ") : ""}`;
  if (VOID.has(node.name)) return `${head} />\n`;
  const body = kids(scope, { ...ctx, pre: ctx.pre || node.name === "pre" });
  if (!body.trim()) return `${head} />\n`;
  return `${head}>\n${body}${pad}</${node.name}>\n`;
}

// ---- locate the screens --------------------------------------------------
const find = (n, pred) => {
  if (pred(n)) return n;
  for (const c of n.children || []) {
    const r = find(c, pred);
    if (r) return r;
  }
  return null;
};
const main = find(doc, (n) => n.name === "main");
const screens = main.children.filter((n) => n.name === "sc-if");

const banner = `/* eslint-disable @typescript-eslint/no-explicit-any */\n// GENERATED by tools/dc2tsx.mjs from design/OmniPost AI.dc.html — do not edit by hand.\n// Re-run \`npm run port:design\` after the design changes.\n`;
mkdirSync(OUT_SCREENS, { recursive: true });
mkdirSync(dirname(OUT_CSS), { recursive: true });

// Screens that became interactive beyond the design template; port design changes to them by hand.
const HAND_MAINTAINED = new Set(["StudioScreen", "IntegrationsScreen"]);
const names = [];
for (const sc of screens) {
  const key = /\{\{\s*r\.(\w+)\s*\}\}/.exec(sc.attribs.value)[1];
  const comp = key[0].toUpperCase() + key.slice(1) + "Screen";
  names.push([key, comp]);
  if (HAND_MAINTAINED.has(comp)) continue;
  const body = sc.children.map((c) => render(c, new Set(), 2, { pre: false })).join("");
  const usesFragment = body.includes("<Fragment");
  const code = `${banner}"use client";\n\n${usesFragment ? 'import { Fragment } from "react";\n' : ""}import { css } from "@/lib/css";\nimport type { ViewModel } from "@/lib/omnipost/logic";\n\nexport function ${comp}({ v }: { v: ViewModel }) {\n  return (\n    <>\n${body}    </>\n  );\n}\n`;
  writeFileSync(resolve(OUT_SCREENS, `${comp}.tsx`), code);
}

writeFileSync(
  resolve(OUT_SCREENS, "index.ts"),
  `${banner}${names.map(([, c]) => `import { ${c} } from "./${c}";`).join("\n")}\n\nexport const SCREENS = {\n${names.map(([k, c]) => `  ${k}: ${c},`).join("\n")}\n} as const;\n\nexport type ScreenKey = keyof typeof SCREENS;\n`,
);

const important = (cssText) =>
  cssText
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `${d} !important;`)
    .join(" ");
let cssOut = `/* GENERATED by tools/dc2tsx.mjs — hover/focus states from the design's style-hover / style-focus. */\n`;
for (const [key, cls] of stateRules) {
  const [kind, rule] = key.split("|");
  cssOut += `.${cls}:${kind} { ${important(rule)} }\n`;
}

if (process.argv.includes("--shell")) {
  const root = doc.children.find((n) => n.type === "tag");
  main.children = [];
  console.log(render(root, new Set(), 2, { pre: false }));
  for (const [key, cls] of stateRules) if (!cssOut.includes(`.${cls}:`)) cssOut += `.${cls}:${key.split("|")[0]} { ${important(key.split("|")[1])} }\n`;
}
writeFileSync(OUT_CSS, cssOut);
console.log(`ported ${names.length} screens: ${names.map(([k]) => k).join(", ")}`);
