/**
 * Applies a definition to the live DOM of a post type's base HTML, the same
 * way the backend compiler does (services/templates.py):
 *   - every field with `x-ui.cssVar` becomes a `--var: value` declaration on
 *     :root, its value written through `x-ui.cssValue` (visibility included:
 *     the --show-* variables are "initial" or "none");
 *   - <link id="google-fonts"> loads only the chosen families, in the weights
 *     and styles used by the typographic roles (typography.*.font/weight/style).
 *
 * The backend replaces the block between `/* @vars:start *\/` and
 * `/* @vars:end *\/`; the preview instead appends its own :root block at the
 * end of <head>, which wins over the base one, so the frame is never reloaded.
 */
import { getIn, isPlainObject, resolveSchema, type JsonObject, type JsonSchema } from "./schema";
import { fontMetaOf, uiOf, type FontMeta, type XUi } from "./x-ui";

const FONTS_LINK_ID = "google-fonts";
const PREVIEW_STYLE_ID = "autopost-editor-vars";
/** Same guard as the backend: a computed value cannot escape its declaration. */
const SAFE_CSS_VALUE = /^[\w\s#%.,()"'+-]*$/;
const PLACEHOLDER = /\{(\w+)\}/g;

/** `{value}` / `{family}`… filled from the value, or the CSS mapped from it. Null if not representable. */
export function cssValue(ui: XUi, value: unknown): string | null {
  const template = ui.cssValue ?? "{value}";
  let css: string | undefined;
  if (typeof template === "object") {
    // Booleans as "true"/"false", like the backend.
    css = template[String(value)];
  } else {
    const fields: JsonObject = isPlainObject(value) ? value : { value };
    let missing = false;
    css = template.replace(PLACEHOLDER, (_, name: string) => {
      if (!(name in fields)) missing = true;
      return String(fields[name]);
    });
    if (missing) return null;
  }
  return css !== undefined && SAFE_CSS_VALUE.test(css) ? css : null;
}

/** The `--var: value` pairs of the fields with `x-ui.cssVar`, in schema order. */
export function cssDeclarations(schema: JsonSchema, values: JsonObject): [string, string][] {
  const out: [string, string][] = [];
  const walk = (node: JsonSchema, value: unknown) => {
    const resolved = resolveSchema(node, schema);
    const ui = uiOf(resolved);
    if (ui.cssVar) {
      // An object with cssVar (e.g. a font) is written as a whole: don't descend.
      const css = value === undefined || value === null ? null : cssValue(ui, value);
      if (css !== null) out.push([ui.cssVar, css]);
      return;
    }
    if (!isPlainObject(value)) return;
    for (const [key, child] of Object.entries(resolved.properties ?? {})) walk(child, value[key]);
  };
  walk(schema, values);
  return out;
}

/** Python's quote_plus(text, safe=":,;@"). */
function quotePlus(text: string) {
  return encodeURIComponent(text)
    .replace(/%20/g, "+")
    .replace(/%3A/gi, ":")
    .replace(/%2C/gi, ",")
    .replace(/%3B/gi, ";")
    .replace(/%40/gi, "@");
}

/**
 * Google Fonts URL with the families of `fonts`, in the weights and styles used
 * by the typographic roles; null when the definition has no fonts.
 */
export function googleFontsHref(schema: JsonSchema, values: JsonObject, fontMeta: FontMeta = fontMetaOf(schema)) {
  const fonts = values.fonts;
  if (!isPlainObject(fonts)) return null;

  const usage = new Map<string, Set<string>>();
  for (const font of Object.values(fonts)) {
    const family = getIn(font, ["family"]);
    if (typeof family === "string" && !usage.has(family)) usage.set(family, new Set());
  }
  if (usage.size === 0) return null;

  const typography = isPlainObject(values.typography) ? values.typography : {};
  for (const style of Object.values(typography)) {
    if (!isPlainObject(style) || typeof style.font !== "string") continue;
    const family = getIn(fonts, [style.font, "family"]);
    if (typeof family !== "string") continue;
    const info = fontMeta[family] ?? {};
    const weight = Number(style.weight ?? 400);
    // A weight the family doesn't have would make Google reject the whole link.
    if (info.weights?.length && !info.weights.includes(weight)) continue;
    // Without italics in the family the browser simulates them.
    const italic = style.style === "italic" && (info.italic ?? true) ? 1 : 0;
    usage.get(family)?.add(`${italic},${weight}`);
  }

  const params = [...usage].map(([family, used]) => {
    let axes = [...used].map((a) => a.split(",").map(Number) as [number, number]);
    if (axes.length === 0) {
      const weights = fontMeta[family]?.weights ?? [400];
      axes = [[0, weights.includes(400) ? 400 : weights[0]]];
    }
    axes.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const spec = axes.some(([italic]) => italic)
      ? `ital,wght@${axes.map(([i, w]) => `${i},${w}`).join(";")}`
      : `wght@${[...new Set(axes.map(([, w]) => w))].sort((a, b) => a - b).join(";")}`;
    return `family=${quotePlus(`${family}:${spec}`)}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join("&")}&display=block`;
}

/** Link that loads every family of the schema (regular weight), to preview them in the pickers. */
export function fontPickerHref(families: string[]) {
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${quotePlus(f)}`).join("&")}&display=swap`;
}

export function applyCustomization(doc: Document, schema: JsonSchema, values: JsonObject) {
  let style = doc.getElementById(PREVIEW_STYLE_ID);
  if (!style) {
    style = doc.createElement("style");
    style.id = PREVIEW_STYLE_ID;
    doc.head.appendChild(style);
  }
  const body = cssDeclarations(schema, values)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  style.textContent = `:root {\n${body}\n}`;

  const link = doc.getElementById(FONTS_LINK_ID);
  const href = googleFontsHref(schema, values);
  // No `instanceof`: the element belongs to the iframe's realm.
  if (link?.tagName === "LINK" && href && link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
}
