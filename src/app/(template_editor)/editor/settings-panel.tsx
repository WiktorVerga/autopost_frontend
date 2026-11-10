"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { googleFontsUrl } from "@/lib/template/compile";
import {
  fieldKind,
  getIn,
  humanize,
  isValidValue,
  resolveSchema,
  type JsonObject,
  type JsonSchema,
  type Path,
} from "@/lib/template/schema";
import { cn } from "@/lib/utils";

type OnChange = (path: Path, value: unknown) => void;

/** Group whose enum values are font families: the options are shown in their own font. */
const FONTS_KEY = "fonts";

/**
 * Form generated from the JSON Schema of the base. Every property is editable
 * except `const` ones (schema_version, base_template), shown as read-only info.
 * Root keywords such as `type`, `additionalProperties` and `required` describe
 * the schema itself and are not settings.
 */
export function SettingsPanel({
  schema,
  values,
  onChange,
  className,
}: {
  schema: JsonSchema;
  values: JsonObject;
  onChange: OnChange;
  className?: string;
}) {
  const entries = Object.entries(schema.properties ?? {}).map(
    ([key, node]) => [key, resolveSchema(node, schema)] as const,
  );
  const fixed = entries.filter(([, node]) => fieldKind(node) === "const");
  const groups = entries.filter(([, node]) => fieldKind(node) === "object");
  const loose = entries.filter(([, node]) => !["const", "object"].includes(fieldKind(node)));
  const fontFamilies = fontOptions(schema);

  return (
    <aside className={cn("flex flex-col overflow-hidden bg-background", className)}>
      {fontFamilies.length > 0 ? (
        // Loads the fonts of the closed list so the font pickers can preview them.
        <link rel="stylesheet" href={googleFontsUrl(fontFamilies)} precedence="default" />
      ) : null}

      <div className="shrink-0 space-y-3 border-b px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Settings
        </p>

        {fixed.length > 0 ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-1">
            {fixed.map(([key, node]) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {humanize(key)}
                </dt>
                <dd className="font-mono text-xs">{String(values[key] ?? node.const)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loose.length > 0 ? (
          <Section title="General">
            {loose.map(([key, node]) => (
              <SchemaField key={key} name={key} path={[key]} node={node} root={schema} values={values} onChange={onChange} />
            ))}
          </Section>
        ) : null}
        {groups.map(([key, node]) => (
          <Section key={key} title={humanize(key)} description={node.description}>
            <ObjectFields path={[key]} node={node} root={schema} values={values} onChange={onChange} />
          </Section>
        ))}
      </div>
    </aside>
  );
}

function fontOptions(schema: JsonSchema) {
  const fonts = schema.properties?.[FONTS_KEY];
  if (!fonts) return [];
  const families = new Set<string>();
  for (const child of Object.values(resolveSchema(fonts, schema).properties ?? {})) {
    for (const option of resolveSchema(child, schema).enum ?? []) {
      if (typeof option === "string") families.add(option);
    }
  }
  return [...families];
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <details open className="group border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 select-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{title}</span>
        <ChevronDownIcon className="size-4 text-muted-foreground <<<<<<<<<<<<-rotate-90 transition-transform group-open:rotate-0" />
      </summary>
      <div className="space-y-5 px-5 pt-1 pb-6">
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
    </details>
  );
}

type FieldProps = {
  path: Path;
  node: JsonSchema;
  root: JsonSchema;
  values: JsonObject;
  onChange: OnChange;
};

function ObjectFields({ path, node, root, values, onChange }: FieldProps) {
  return (
    <div className="space-y-5">
      {Object.entries(node.properties ?? {}).map(([key, child]) => (
        <SchemaField
          key={key}
          name={key}
          path={[...path, key]}
          node={resolveSchema(child, root)}
          root={root}
          values={values}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function SchemaField(props: FieldProps & { name: string }) {
  const { name, path, node, root, values, onChange } = props;
  const value = getIn(values, path);
  const label = node.title ?? humanize(name);

  switch (fieldKind(node)) {
    case "object":
      return (
        <fieldset className="space-y-4 border-l pl-4">
          <legend className="-ml-4 mb-3 pl-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </legend>
          {node.description ? (
            <p className="-mt-2 text-xs leading-relaxed text-muted-foreground">{node.description}</p>
          ) : null}
          <ObjectFields path={path} node={node} root={root} values={values} onChange={onChange} />
        </fieldset>
      );
    case "const":
      return (
        <Row label={label} description={node.description}>
          <span className="font-mono text-xs text-muted-foreground">{String(node.const)}</span>
        </Row>
      );
    case "boolean":
      return <BooleanField label={label} node={node} path={path} value={value} onChange={onChange} />;
    case "color":
      return <ColorField label={label} node={node} path={path} value={value} onChange={onChange} />;
    case "enum":
      return (
        <EnumField
          label={label}
          node={node}
          path={path}
          value={value}
          onChange={onChange}
          fontPreview={path[0] === FONTS_KEY}
        />
      );
    case "number":
      return <NumberField label={label} node={node} path={path} value={value} onChange={onChange} />;
    case "string":
      return <StringField label={label} node={node} path={path} value={value} onChange={onChange} />;
    default:
      return (
        <Row label={label} description={node.description}>
          <span className="text-xs text-muted-foreground">Not editable here</span>
        </Row>
      );
  }
}

// ---- Leaf fields ----

type LeafProps = {
  label: string;
  node: JsonSchema;
  path: Path;
  value: unknown;
  onChange: OnChange;
};

function FieldLabel({ id, label, description }: { id?: string; label: string; description?: string }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      {description ? (
        <p className="text-xs leading-snug text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <FieldLabel label={label} description={description} />
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/**
 * Text kept locally while typing: the value is committed only when it is
 * valid, and the draft is reset when the value changes from outside.
 */
function useDraft(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  const [draft, setDraft] = useState(text);
  const [synced, setSynced] = useState(text);
  if (synced !== text) {
    setSynced(text);
    setDraft(text);
  }
  return [draft, setDraft, text] as const;
}

function BooleanField({ label, node, path, value, onChange }: LeafProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <FieldLabel id={id} label={label} description={node.description} />
      <Switch
        id={id}
        checked={value === true}
        onCheckedChange={(checked) => onChange(path, checked)}
        className="mt-0.5"
      />
    </div>
  );
}

/** "#abc" → "#aabbcc", required by <input type="color">. */
function toLongHex(hex: string) {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
}

function ColorField({ label, node, path, value, onChange }: LeafProps) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const invalid = !isValidValue(node, draft);

  return (
    <div className="space-y-2">
      <FieldLabel id={id} label={label} description={node.description} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={toLongHex(committed)}
          onChange={(e) => onChange(path, e.target.value.toUpperCase())}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          id={id}
          value={draft}
          spellCheck={false}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (isValidValue(node, next)) onChange(path, next);
          }}
          onBlur={() => setDraft(committed)}
          className="font-mono text-xs uppercase"
        />
      </div>
    </div>
  );
}

function EnumField({
  label,
  node,
  path,
  value,
  onChange,
  fontPreview,
}: LeafProps & { fontPreview?: boolean }) {
  const id = useId();
  const options = node.enum ?? [];
  const fontStyle = (option: unknown) =>
    fontPreview ? { fontFamily: `'${String(option)}', system-ui` } : undefined;

  return (
    <div className="space-y-2">
      <FieldLabel id={id} label={label} description={node.description} />
      <Select
        value={JSON.stringify(value)}
        onValueChange={(raw) => onChange(path, JSON.parse(raw))}
      >
        <SelectTrigger id={id} className="w-full" style={fontStyle(value)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={JSON.stringify(option)} value={JSON.stringify(option)} style={fontStyle(option)}>
              {String(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberField({ label, node, path, value, onChange }: LeafProps) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const step = node.multipleOf ?? (node.type === "integer" ? 1 : 0.1);
  const hasRange = node.minimum !== undefined && node.maximum !== undefined;
  const current = typeof value === "number" ? value : Number(node.default ?? node.minimum ?? 0);
  const invalid = draft !== "" && !isValidValue(node, Number(draft));

  function clamp(n: number) {
    let result = node.type === "integer" ? Math.round(n) : n;
    if (node.minimum !== undefined) result = Math.max(node.minimum, result);
    if (node.maximum !== undefined) result = Math.min(node.maximum, result);
    return result;
  }

  return (
    <div className="space-y-2">
      <FieldLabel id={id} label={label} description={node.description} />
      <div className="flex items-center gap-3">
        {hasRange ? (
          <Slider
            aria-label={label}
            min={node.minimum}
            max={node.maximum}
            step={step}
            value={[current]}
            onValueChange={([n]) => onChange(path, n)}
            className="flex-1"
          />
        ) : null}
        <div className={cn("relative shrink-0", hasRange ? "w-24" : "w-full")}>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={node.minimum}
            max={node.maximum}
            step={step}
            value={draft}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = e.target.valueAsNumber;
              if (isValidValue(node, n)) onChange(path, n);
            }}
            onBlur={() => {
              const n = Number(draft);
              if (draft === "" || !Number.isFinite(n)) return setDraft(committed);
              const next = clamp(n);
              setDraft(String(next));
              onChange(path, next);
            }}
            className="pr-8 font-mono text-xs tabular-nums"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
            px
          </span>
        </div>
      </div>
      {hasRange ? (
        <p className="font-mono text-[10px] text-muted-foreground">
          {node.minimum} – {node.maximum}
        </p>
      ) : null}
    </div>
  );
}

function StringField({ label, node, path, value, onChange }: LeafProps) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const invalid = !isValidValue(node, draft);

  return (
    <div className="space-y-2">
      <FieldLabel id={id} label={label} description={node.description} />
      <Input
        id={id}
        value={draft}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          if (isValidValue(node, e.target.value)) onChange(path, e.target.value);
        }}
        onBlur={() => setDraft(committed)}
      />
    </div>
  );
}
