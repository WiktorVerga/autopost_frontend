/**
 * Helpers to read the JSON Schema of a base template and the customization
 * JSON it validates. Only the subset of JSON Schema used by the bases is
 * supported: objects, strings (with enum or pattern), integers/numbers,
 * booleans, `const` and local `$ref` to `#/$defs/...`.
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
  additionalProperties?: boolean;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  pattern?: string;
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

const HEX_COLOR_SAMPLE = "#A1B2C3";

export function fieldKind(node: JsonSchema): FieldKind {
  if ("const" in node) return "const";
  if (node.enum) return "enum";
  switch (node.type) {
    case "object":
      return "object";
    case "boolean":
      return "boolean";
    case "integer":
    case "number":
      return "number";
    case "string":
      return node.pattern && safeTest(node.pattern, HEX_COLOR_SAMPLE) ? "color" : "string";
    default:
      return node.properties ? "object" : "unsupported";
  }
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
      return typeof value === "string" && (!node.pattern || safeTest(node.pattern, value));
    case "enum":
      return node.enum!.includes(value);
    case "number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        (node.type !== "integer" || Number.isInteger(value)) &&
        (node.minimum === undefined || value >= node.minimum) &&
        (node.maximum === undefined || value <= node.maximum)
      );
    case "boolean":
      return typeof value === "boolean";
    default:
      return true;
  }
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
