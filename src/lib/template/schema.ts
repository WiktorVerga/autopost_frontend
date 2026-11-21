/**
 * Helpers to read the JSON Schema of a base template and the customization
 * JSON it validates. The editor is generated from the schema alone, so a new
 * post type only needs its schema (and HTML) on the backend. Supported subset:
 * objects, strings (enum, pattern, length, `format: "color"`), integers and
 * numbers (bounds, multipleOf), booleans, `const`, enums written as
 * `oneOf`/`anyOf` of `const` (with titles as labels) and local `$ref` to
 * `#/$defs/...`. Anything else is shown as "not editable" and kept as is.
 */

export type JsonSchema = {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  title?: string;
  description?: string;
  type?: "object" | "string" | "integer" | "number" | "boolean" | "array";
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  required?: string[];
  enum?: unknown[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  const?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  pattern?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  items?: JsonSchema;
  /** Annotations ignored by validation: allowed on any node. */
  [annotation: `x-${string}`]: unknown;
};

export type JsonObject = Record<string, unknown>;
export type Path = readonly string[];

export function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Parses the schema sent by the backend, which may arrive as a string or as an object. */
export function parseSchema(raw: unknown): JsonSchema {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!isPlainObject(value)) throw new Error("The template schema is not a JSON object.");
  return value as JsonSchema;
}

/**
 * Follows `$ref` to `#/$defs/...`. Keywords next to the `$ref` (description,
 * default...) win over the referenced definition, as in JSON Schema 2020-12.
 */
export function resolveSchema(node: JsonSchema, root: JsonSchema): JsonSchema {
  if (!node.$ref) return node;
  const { $ref, ...siblings } = node;
  const match = /^#\/\$defs\/(.+)$/.exec($ref);
  const target = match ? root.$defs?.[match[1]] : undefined;
  if (!target) return siblings;
  return { ...resolveSchema(target, root), ...siblings };
}

export type FieldKind = "object" | "const" | "color" | "enum" | "number" | "boolean" | "string" | "unsupported";

export type EnumOption = { value: unknown; label: string };

const HEX_COLOR_SAMPLE = "#A1B2C3";

/**
 * Choices of an enum field, from `enum` or from `oneOf`/`anyOf` made only of
 * `const` (their `title` becomes the label). Null when the node is not an enum.
 */
export function enumOptions(node: JsonSchema): EnumOption[] | null {
  if (node.enum) return node.enum.map((value) => ({ value, label: String(value) }));
  const variants = node.oneOf ?? node.anyOf;
  if (variants?.length && variants.every((v) => isPlainObject(v) && "const" in v)) {
    return variants.map((v) => ({ value: v.const, label: v.title ?? String(v.const) }));
  }
  return null;
}

export function fieldKind(node: JsonSchema): FieldKind {
  if ("const" in node) return "const";
  if (enumOptions(node)) return "enum";
  switch (node.type) {
    case "object":
      return "object";
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "string":
      return isColor(node) ? "color" : "string";
    default:
      return node.properties ? "object" : "unsupported";
  }
}

function isColor(node: JsonSchema) {
  if (node.format === "color") return true;
  return !!node.pattern && safeTest(node.pattern, HEX_COLOR_SAMPLE);
}

function safeTest(pattern: string, value: string) {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

/** True when `value` satisfies the constraints of a leaf field. */
export function isValidValue(node: JsonSchema, value: unknown): boolean {
  switch (fieldKind(node)) {
    case "color":
    case "string":
      return (
        typeof value === "string" &&
        (!node.pattern || safeTest(node.pattern, value)) &&
        (node.minLength === undefined || value.length >= node.minLength) &&
        (node.maxLength === undefined || value.length <= node.maxLength)
      );
    case "enum":
      return enumOptions(node)!.some((option) => Object.is(option.value, value));
    case "number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        (node.type !== "integer" || Number.isInteger(value)) &&
        (node.minimum === undefined || value >= node.minimum) &&
        (node.maximum === undefined || value <= node.maximum) &&
        (node.exclusiveMinimum === undefined || value > node.exclusiveMinimum) &&
        (node.exclusiveMaximum === undefined || value < node.exclusiveMaximum) &&
        (!node.multipleOf || isMultiple(value, node.multipleOf))
      );
    case "boolean":
      return typeof value === "boolean";
    case "const":
      return Object.is(value, node.const);
    default:
      return true;
  }
}

/** Tolerant to float errors: 0.3 is a multiple of 0.1. */
function isMultiple(value: number, step: number) {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-9;
}

/**
 * Complete customization made only of the schema defaults.
 * Defaults declared on each property win over the `default` of the parent object.
 */
export function buildDefaults(node: JsonSchema, root: JsonSchema): unknown {
  const schema = resolveSchema(node, root);
  if ("const" in schema) return schema.const;

  if (fieldKind(schema) === "object" && schema.properties) {
    const result: JsonObject = isPlainObject(schema.default) ? structuredClone(schema.default) : {};
    for (const [key, child] of Object.entries(schema.properties)) {
      const value = buildDefaults(child, root);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }

  return schema.default === undefined ? undefined : structuredClone(schema.default);
}

/**
 * Brings a customization in line with the current schema of its base:
 *   - every invalid leaf (wrong type, out of range, option no longer offered)
 *     goes back to its default;
 *   - keys the schema does not declare are dropped when it forbids them
 *     (`additionalProperties: false`), so saving is not rejected.
 * Values the editor cannot edit ("unsupported") are kept untouched.
 * Used on saved definitions and restored drafts, which may predate the schema.
 */
export function conformToSchema(node: JsonSchema, root: JsonSchema, value: unknown): unknown {
  const schema = resolveSchema(node, root);
  const kind = fieldKind(schema);

  if (kind === "object") {
    const defaults = buildDefaults(schema, root);
    const source = isPlainObject(value) ? value : {};
    const result: JsonObject = {};
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(source)) {
      if (key in properties) continue;
      if (schema.additionalProperties !== false) result[key] = child;
    }
    for (const [key, child] of Object.entries(properties)) {
      const next = key in source ? conformToSchema(child, root, source[key]) : getIn(defaults, [key]);
      if (next !== undefined) result[key] = next;
    }
    return result;
  }

  if (kind === "unsupported") return value === undefined ? buildDefaults(schema, root) : value;
  if (value !== undefined && isValidValue(schema, value)) return value;
  return buildDefaults(schema, root);
}

/** Deep merge of plain objects: values in `override` win, arrays are replaced. */
export function deepMerge(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }
  const result: JsonObject = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = deepMerge(base[key], value);
  }
  return result;
}

export function getIn(value: unknown, path: Path): unknown {
  let current = value;
  for (const key of path) {
    if (!isPlainObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

/** Immutable set: returns a copy of `target` with `value` at `path`. */
export function setIn<T>(target: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const source: JsonObject = isPlainObject(target) ? target : {};
  return { ...source, [key]: setIn(source[key], rest, value) } as T;
}

/** "background" → "Background", "schema_version" → "Schema version". */
export function humanize(key: string) {
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
