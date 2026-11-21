/**
 * The `x-ui` annotations of a post type's editable schema: how the editor
 * builds its sidebar and how each value becomes CSS. Reference (from the
 * schema's own `$comment`):
 *
 * On objects:
 *   layout       "section" (top-level sidebar group) | "subsection" (collapsible block)
 *   order        position among siblings
 *   collapsed    initial state of a subsection
 *   previewSlide slide type to show in the preview while the block is open (null = any)
 *   enabledWhen  on a section: disables all its controls
 * On fields:
 *   control      color | font | segmented | swatch | slider | select | toggle | switch | hidden
 *   unit, step   for sliders
 *   cssVar       CSS custom property written on :root
 *   cssValue     template for its value ("{value}px", "\"{family}\", {fallback}") or a map
 *                from the JSON value (booleans as "true"/"false") to the CSS value
 *   optionsFrom  restrict a select to fontMeta[<family of fonts[sibling fontRoleField]>][meta]
 *   enabledWhen  {path, equals} on another value, or {fontRoleField, meta, equals} on font metadata
 *   derivedFrom  value set automatically from a sibling field's font metadata
 *   onValue / offValue  values of a toggle bound to an enum
 *   icons        render options as icons
 *
 * Nothing here knows a specific post type: a new one only needs its schema.
 */
import {
  enumOptions,
  getIn,
  isPlainObject,
  resolveSchema,
  setIn,
  type JsonObject,
  type JsonSchema,
  type Path,
} from "./schema";

export type Control =
  | "color"
  | "font"
  | "segmented"
  | "swatch"
  | "slider"
  | "select"
  | "toggle"
  | "switch"
  | "hidden";

export type EnabledWhen =
  | { path: string; equals: unknown }
  | { fontRoleField: string; meta: string; equals: unknown };

export type XUi = {
  control?: Control | (string & {});
  layout?: "section" | "subsection" | (string & {});
  order?: number;
  collapsed?: boolean;
  previewSlide?: string | null;
  unit?: string;
  step?: number;
  cssVar?: string;
  cssValue?: string | Record<string, string>;
  optionsFrom?: { fontRoleField: string; meta: string };
  enabledWhen?: EnabledWhen;
  derivedFrom?: { field: string; meta: string };
  onValue?: unknown;
  offValue?: unknown;
  icons?: boolean;
};

/** Metadata of a font family, from `x-fontMeta` in `$defs`. */
export type FontInfo = { category?: string; weights?: number[]; italic?: boolean; [meta: string]: unknown };
export type FontMeta = Record<string, FontInfo>;

/** Group of the definition that holds the font families, as `fonts.<role>.family`. */
const FONTS_KEY = "fonts";

export function uiOf(node: JsonSchema): XUi {
  const ui = node["x-ui"];
  return isPlainObject(ui) ? (ui as XUi) : {};
}

export function isHidden(node: JsonSchema) {
  return uiOf(node).control === "hidden";
}

/** Properties of an object node, resolved and sorted by `x-ui.order` (schema order on ties). */
export function orderedProperties(node: JsonSchema, root: JsonSchema): [string, JsonSchema][] {
  return Object.entries(node.properties ?? {})
    .map(([key, child], index) => ({ key, node: resolveSchema(child, root), index }))
    .sort((a, b) => (uiOf(a.node).order ?? Infinity) - (uiOf(b.node).order ?? Infinity) || a.index - b.index)
    .map(({ key, node }) => [key, node]);
}

/** The font metadata declared by the schema (`x-fontMeta` on one of its `$defs`). */
export function fontMetaOf(schema: JsonSchema): FontMeta {
  for (const definition of Object.values(schema.$defs ?? {})) {
    const meta = definition["x-fontMeta"];
    if (isPlainObject(meta)) return meta as FontMeta;
  }
  return {};
}

/** Family chosen for a font role: `fonts.<role>.family`. */
function familyOfRole(values: JsonObject, role: unknown): string | undefined {
  if (typeof role !== "string") return undefined;
  const family = getIn(values, [FONTS_KEY, role, "family"]);
  return typeof family === "string" ? family : undefined;
}

/** Font metadata reached from a field's sibling `fontRoleField`. */
function roleMeta(fontMeta: FontMeta, values: JsonObject, parent: Path, fontRoleField: string, meta: string) {
  const family = familyOfRole(values, getIn(values, [...parent, fontRoleField]));
  return family ? fontMeta[family]?.[meta] : undefined;
}

/** False when the field's (or its section's) `enabledWhen` does not hold. */
export function isEnabled(node: JsonSchema, path: Path, values: JsonObject, fontMeta: FontMeta): boolean {
  const condition = uiOf(node).enabledWhen;
  if (!condition) return true;
  if ("path" in condition) {
    return Object.is(getIn(values, condition.path.split(".")), condition.equals);
  }
  const meta = roleMeta(fontMeta, values, path.slice(0, -1), condition.fontRoleField, condition.meta);
  // Unknown metadata: don't lock the user out.
  return meta === undefined || Object.is(meta, condition.equals);
}

/**
 * Values offered by a select: all the enum options, or only those listed in
 * the font metadata named by `optionsFrom` (e.g. the weights of the family).
 */
export function allowedValues(node: JsonSchema, path: Path, values: JsonObject, fontMeta: FontMeta) {
  const options = enumOptions(node) ?? [];
  const from = uiOf(node).optionsFrom;
  if (!from) return options;
  const allowed = roleMeta(fontMeta, values, path.slice(0, -1), from.fontRoleField, from.meta);
  if (!Array.isArray(allowed)) return options;
  return options.filter((option) => allowed.includes(option.value));
}

/** The allowed value closest to `value` (numbers by distance, otherwise the first). */
function closest(value: unknown, allowed: unknown[]) {
  if (typeof value === "number") {
    const numbers = allowed.filter((v): v is number => typeof v === "number");
    if (numbers.length) return numbers.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a));
  }
  return allowed[0];
}

/**
 * Keeps the values the schema computes from other values in line, after any
 * edit:
 *   - `derivedFrom`: e.g. a font's fallback follows the category of its family;
 *   - `optionsFrom`: e.g. a weight the new family doesn't offer moves to the
 *     closest one it does (the backend would reject the definition otherwise).
 */
export function applyDerivedValues(schema: JsonSchema, values: JsonObject): JsonObject {
  const fontMeta = fontMetaOf(schema);
  let result = values;

  const visit = (node: JsonSchema, path: Path) => {
    for (const [key, child] of orderedProperties(node, schema)) {
      const childPath = [...path, key];
      if (child.properties) {
        visit(child, childPath);
        continue;
      }
      const ui = uiOf(child);
      const current = getIn(result, childPath);

      if (ui.derivedFrom) {
        const family = getIn(result, [...path, ui.derivedFrom.field]);
        const derived = typeof family === "string" ? fontMeta[family]?.[ui.derivedFrom.meta] : undefined;
        if (derived !== undefined && !Object.is(derived, current)) result = setIn(result, childPath, derived);
      }

      if (ui.optionsFrom) {
        const allowed = allowedValues(child, childPath, result, fontMeta).map((o) => o.value);
        if (allowed.length && !allowed.some((v) => Object.is(v, current))) {
          result = setIn(result, childPath, closest(current, allowed));
        }
      }
    }
  };

  visit(resolveSchema(schema, schema), []);
  return result;
}
