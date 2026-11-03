/**
 * Applies a customization JSON to the DOM of a base template, following the
 * contract described at the top of every base HTML:
 *   - #t-fonts → link to only the Google Fonts chosen in the JSON
 *   - #t-vars  → CSS variables computed from defaults + JSON
 *   - data-el  → optional element, shown only if `visibility.<group>.<key>` is true
 *
 * The preview patches the live document instead of rebuilding it, so editing
 * a value does not reload the frame. `data-field` and `data-repeat` are only
 * meaningful to the Jinja compiler on the backend and are left untouched.
 */
import { getIn, isPlainObject, type JsonObject } from "./schema";

/** Group that drives `data-el`; every other object group becomes CSS variables. */
const VISIBILITY_KEY = "visibility";
/** Group whose values are font families to load from Google Fonts. */
const FONTS_KEY = "fonts";

/** Short names used by the templates in place of the JSON key. */
const VAR_ALIASES: Record<string, string[]> = {
  background: ["bg"],
};

/**
 * Axes requested for each font of the closed list. Weights not offered by a
 * family make Google Fonts reject the whole request, so unknown families are
 * requested with no axis (regular weight only).
 */
const FONT_AXES: Record<string, string> = {
  Inter: "wght@400;500;600",
  "Space Grotesk": "wght@400;500;600",
  "IBM Plex Mono": "wght@400;500;600",
  Fraunces: "opsz,wght@9..144,400;9..144,500;9..144,600",
  "Playfair Display": "wght@400;500;600",
  "DM Serif Display": "",
};

export type CssVars = Map<string, string>;

/** Reads the `--name: value` declarations of `#t-vars`, before any patch. */
export function readTemplateVars(doc: Document): CssVars {
  const vars: CssVars = new Map();
  const css = doc.getElementById("t-vars")?.textContent ?? "";
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

export function applyCustomization(doc: Document, values: JsonObject, baseVars: CssVars) {
  applyVars(doc, values, baseVars);
  applyFonts(doc, values);
  applyVisibility(doc, values);
}

function applyVars(doc: Document, values: JsonObject, baseVars: CssVars) {
  const style = doc.getElementById("t-vars");
  if (!style) return;

  const vars = new Map(baseVars);
  for (const [group, groupValues] of Object.entries(values)) {
    if (group === VISIBILITY_KEY || !isPlainObject(groupValues)) continue;
    for (const [key, value] of Object.entries(groupValues)) {
      if (isPlainObject(value) || value === undefined || value === null) continue;
      const name = varName(group, key, baseVars);
      vars.set(name, formatVar(value, baseVars.get(name)));
    }
  }

  const body = [...vars].map(([name, value]) => `  ${name}: ${value};`).join("\n");
  style.textContent = `\n:root {\n${body}\n}\n`;
}

/** colors.background → the first of --color-background, --color-bg... declared by the template. */
function varName(group: string, key: string, baseVars: CssVars) {
  const prefixes = [group.replace(/s$/, ""), group];
  const keys = [key, ...(VAR_ALIASES[key] ?? [])];
  for (const prefix of prefixes) {
    for (const k of keys) {
      const name = `--${prefix}-${k}`;
      if (baseVars.has(name)) return name;
    }
  }
  return `--${prefixes[0]}-${key}`;
}

function formatVar(value: unknown, original: string | undefined) {
  if (typeof value === "number") return `${value}px`;
  const text = String(value);
  // Font stacks: swap the first family and keep the template's fallbacks.
  const stack = original && /^(['"])(.*?)\1(.*)$/.exec(original);
  if (stack) return `'${text.replace(/'/g, "")}'${stack[3]}`;
  return text;
}

function applyFonts(doc: Document, values: JsonObject) {
  const link = doc.getElementById("t-fonts");
  const fonts = values[FONTS_KEY];
  // No `instanceof`: the element belongs to the iframe's realm.
  if (link?.tagName !== "LINK" || !isPlainObject(fonts)) return;

  const families = [...new Set(Object.values(fonts).filter((f): f is string => typeof f === "string"))];
  if (families.length === 0) return;

  const href = googleFontsUrl(families);
  if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

export function googleFontsUrl(families: string[]) {
  const params = families.map((family) => {
    const name = encodeURIComponent(family).replace(/%20/g, "+");
    const axes = FONT_AXES[family];
    return `family=${name}${axes ? `:${axes}` : ""}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
}

function applyVisibility(doc: Document, values: JsonObject) {
  const visibility = values[VISIBILITY_KEY];
  for (const el of doc.querySelectorAll<HTMLElement>("[data-el]")) {
    const path = (el.dataset.el ?? "").split(".");
    // Elements not covered by the JSON stay visible.
    el.hidden = getIn(visibility, path) === false;
  }
}
