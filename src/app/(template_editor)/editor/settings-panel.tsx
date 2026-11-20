"use client";

import { useId, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ChevronDownIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cssDeclarations, cssValue, fontPickerHref } from "@/lib/template/compile";
import {
  enumOptions,
  fieldKind,
  getIn,
  humanize,
  isValidValue,
  type EnumOption,
  type JsonObject,
  type JsonSchema,
  type Path,
} from "@/lib/template/schema";
import {
  allowedValues,
  fontMetaOf,
  isEnabled,
  isHidden,
  orderedProperties,
  uiOf,
  type FontMeta,
} from "@/lib/template/x-ui";
import { cn } from "@/lib/utils";

type OnChange = (path: Path, value: unknown) => void;

/** Everything a field needs besides its own node and path. */
type Ctx = {
  root: JsonSchema;
  values: JsonObject;
  fontMeta: FontMeta;
  /** CSS custom properties computed from the current values (used by swatches). */
  cssVars: Map<string, string>;
  onChange: OnChange;
  onFocusSlide: (slide: string | null) => void;
};

/** Icons for `x-ui.icons`, by option value. Options without one show their label. */
const OPTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
};

/**
 * Sidebar generated from the editable schema of the post type. Its `x-ui`
 * annotations decide everything: sections and collapsible subsections, order,
 * control of each field, units and steps, conditions that disable a control,
 * options restricted by the chosen font. No field is hard-coded, so a new
 * post type gets its sidebar from its schema alone.
 */
export function SettingsPanel({
  schema,
  values,
  onChange,
  onFocusSlide,
  className,
}: {
  schema: JsonSchema;
  values: JsonObject;
  onChange: OnChange;
  /** A block with `x-ui.previewSlide` was opened: show that slide. */
  onFocusSlide: (slide: string | null) => void;
  className?: string;
}) {
  const fontMeta = useMemo(() => fontMetaOf(schema), [schema]);
  const cssVars = useMemo(() => new Map(cssDeclarations(schema, values)), [schema, values]);
  const fontsHref = fontPickerHref(Object.keys(fontMeta));

  const ctx: Ctx = { root: schema, values, fontMeta, cssVars, onChange, onFocusSlide };
  const entries = orderedProperties(schema, schema).filter(([, node]) => !isHidden(node));
  const groups = entries.filter(([, node]) => fieldKind(node) === "object");
  const loose = entries.filter(([, node]) => fieldKind(node) !== "object" && fieldKind(node) !== "const");

  return (
    <aside className={cn("flex flex-col overflow-hidden bg-background", className)}>
      {fontsHref ? (
        // Loads the families of the schema so the font pickers can preview them.
        <link rel="stylesheet" href={fontsHref} precedence="default" />
      ) : null}

      <div className="shrink-0 border-b px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loose.length > 0 ? (
          <Section title="General">
            {loose.map(([key, node]) => (
              <Field key={key} name={key} path={[key]} node={node} ctx={ctx} />
            ))}
          </Section>
        ) : null}
        {groups.map(([key, node]) => (
          <Section
            key={key}
            title={node.title ?? humanize(key)}
            description={node.description}
            defaultOpen={uiOf(node).collapsed !== true}
          >
            <Fields path={[key]} node={node} ctx={ctx} disabled={!isEnabled(node, [key], values, fontMeta)} />
          </Section>
        ))}
      </div>
    </aside>
  );
}

function Section({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group/section border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 select-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em]">{title}</span>
        <ChevronDownIcon className="size-4 -rotate-90 text-muted-foreground transition-transform group-open/section:rotate-0" />
      </summary>
      <div className="space-y-5 px-5 pt-1 pb-6">
        {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        {children}
      </div>
    </details>
  );
}

type NodeProps = { path: Path; node: JsonSchema; ctx: Ctx; disabled?: boolean };

/** The visible properties of an object node, in `x-ui.order`. */
function Fields({ path, node, ctx, disabled }: NodeProps) {
  return (
    <div className="space-y-5">
      {orderedProperties(node, ctx.root)
        .filter(([, child]) => !isHidden(child))
        .map(([key, child]) => (
          <Field key={key} name={key} path={[...path, key]} node={child} ctx={ctx} parentDisabled={disabled} />
        ))}
    </div>
  );
}

/** Collapsible block inside a section (`x-ui.layout: "subsection"`). */
function Subsection({ name, path, node, ctx, disabled }: NodeProps & { name: string }) {
  const ui = uiOf(node);
  return (
    <details
      open={ui.collapsed !== true}
      onToggle={(e) => {
        if (e.currentTarget.open && ui.previewSlide !== undefined) ctx.onFocusSlide(ui.previewSlide);
      }}
      className="group/sub border-l"
    >
      <summary className="-ml-px flex cursor-pointer list-none items-center gap-2 border-l border-transparent py-1 pl-3 select-none hover:border-foreground [&::-webkit-details-marker]:hidden">
        <ChevronDownIcon className="size-3.5 -rotate-90 text-muted-foreground transition-transform group-open/sub:rotate-0" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {node.title ?? humanize(name)}
        </span>
      </summary>
      <div className="space-y-4 pt-3 pb-1 pl-4">
        {node.description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{node.description}</p>
        ) : null}
        <Fields path={path} node={node} ctx={ctx} disabled={disabled} />
      </div>
    </details>
  );
}

function Field({
  name,
  path,
  node,
  ctx,
  parentDisabled,
}: Omit<NodeProps, "disabled"> & { name: string; parentDisabled?: boolean }) {
  const ui = uiOf(node);
  const disabled = !!parentDisabled || !isEnabled(node, path, ctx.values, ctx.fontMeta);
  const value = getIn(ctx.values, path);
  const label = node.title ?? humanize(name);
  const leaf = { label, node, path, value, onChange: ctx.onChange, disabled, description: node.description };

  if (node.properties) {
    if (ui.control === "font") return <FontField {...leaf} ctx={ctx} />;
    if (ui.layout === "subsection") return <Subsection name={name} path={path} node={node} ctx={ctx} disabled={disabled} />;
    return (
      <fieldset className="space-y-4 border-l pl-4">
        <legend className="-ml-4 mb-3 pl-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </legend>
        <Fields path={path} node={node} ctx={ctx} disabled={disabled} />
      </fieldset>
    );
  }

  switch (ui.control) {
    case "color":
      return <ColorField {...leaf} />;
    case "font":
      return <SelectField {...leaf} options={enumOptions(node) ?? []} fontPreview />;
    case "segmented":
      return <SegmentedField {...leaf} options={enumOptions(node) ?? []} icons={ui.icons} />;
    case "swatch":
      return <SwatchField {...leaf} ctx={ctx} />;
    case "slider":
      return <NumberField {...leaf} unit={ui.unit} step={ui.step} />;
    case "select":
      return <SelectField {...leaf} options={allowedValues(node, path, ctx.values, ctx.fontMeta)} />;
    case "toggle":
      return <ToggleField {...leaf} onValue={ui.onValue ?? true} offValue={ui.offValue ?? false} />;
    case "switch":
      return <BooleanField {...leaf} />;
  }

  // No (known) control: pick one from the schema itself.
  switch (fieldKind(node)) {
    case "color":
      return <ColorField {...leaf} />;
    case "enum": {
      const options = enumOptions(node) ?? [];
      return options.length <= 3 ? <SegmentedField {...leaf} options={options} /> : <SelectField {...leaf} options={options} />;
    }
    case "number":
      return <NumberField {...leaf} unit={ui.unit} step={ui.step} />;
    case "boolean":
      return <BooleanField {...leaf} />;
    case "string":
      return <StringField {...leaf} />;
    case "const":
      return null;
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
  description?: string;
  node: JsonSchema;
  path: Path;
  value: unknown;
  onChange: OnChange;
  disabled: boolean;
};

function FieldLabel({ id, label, description }: { id?: string; label: string; description?: string }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      {description ? <p className="text-xs leading-snug text-muted-foreground">{description}</p> : null}
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

/** Dims a field whose `enabledWhen` does not hold. */
function FieldShell({ disabled, className, children }: { disabled: boolean; className?: string; children: ReactNode }) {
  return (
    <div aria-disabled={disabled || undefined} className={cn(className, disabled && "opacity-50")}>
      {children}
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

function BooleanField({ label, description, path, value, onChange, disabled }: LeafProps) {
  const id = useId();
  return (
    <FieldShell disabled={disabled} className="flex items-start justify-between gap-4">
      <FieldLabel id={id} label={label} description={description} />
      <Switch
        id={id}
        checked={value === true}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(path, checked)}
        className="mt-0.5"
      />
    </FieldShell>
  );
}

/** A switch bound to two enum values (`x-ui.onValue` / `offValue`), e.g. italic ↔ normal. */
function ToggleField({
  label,
  description,
  path,
  value,
  onChange,
  disabled,
  onValue,
  offValue,
}: LeafProps & { onValue: unknown; offValue: unknown }) {
  const id = useId();
  return (
    <FieldShell disabled={disabled} className="flex items-start justify-between gap-4">
      <FieldLabel id={id} label={label} description={description} />
      <Switch
        id={id}
        checked={Object.is(value, onValue)}
        disabled={disabled}
        onCheckedChange={(checked) => onChange(path, checked ? onValue : offValue)}
        className="mt-0.5"
      />
    </FieldShell>
  );
}

/** "#abc" → "#aabbcc", required by <input type="color">. */
function toLongHex(hex: string) {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000";
}

function ColorField({ label, description, node, path, value, onChange, disabled }: LeafProps) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const invalid = !isValidValue(node, draft);

  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <FieldLabel id={id} label={label} description={description} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={toLongHex(committed)}
          disabled={disabled}
          onChange={(e) => onChange(path, e.target.value.toUpperCase())}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border bg-transparent p-1 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          id={id}
          value={draft}
          spellCheck={false}
          disabled={disabled}
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
    </FieldShell>
  );
}

function SelectField({
  label,
  description,
  path,
  value,
  onChange,
  disabled,
  options,
  fontPreview,
}: LeafProps & { options: EnumOption[]; fontPreview?: boolean }) {
  const id = useId();
  const fontStyle = (option: unknown) => (fontPreview ? { fontFamily: `'${String(option)}', system-ui` } : undefined);

  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <FieldLabel id={id} label={label} description={description} />
      <Select value={JSON.stringify(value)} disabled={disabled} onValueChange={(raw) => onChange(path, JSON.parse(raw))}>
        <SelectTrigger id={id} className="w-full" style={fontStyle(value)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={JSON.stringify(option.value)}
              value={JSON.stringify(option.value)}
              style={fontStyle(option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

/** Font object (`x-ui.control: "font"`): the family is chosen here, the rest is derived. */
function FontField({ label, description, node, path, value, onChange, disabled, ctx }: LeafProps & { ctx: Ctx }) {
  const familyNode = orderedProperties(node, ctx.root).find(([key]) => key === "family")?.[1];
  if (!familyNode) return null;
  const family = getIn(value, ["family"]);
  const category = typeof family === "string" ? ctx.fontMeta[family]?.category : undefined;

  return (
    <div className="space-y-1.5">
      <SelectField
        label={label}
        description={description}
        node={familyNode}
        path={[...path, "family"]}
        value={family}
        onChange={onChange}
        disabled={disabled}
        options={enumOptions(familyNode) ?? []}
        fontPreview
      />
      {category ? <p className="font-mono text-[10px] text-muted-foreground">Fallback: {category}</p> : null}
    </div>
  );
}

function SegmentedField({
  label,
  description,
  path,
  value,
  onChange,
  disabled,
  options,
  icons,
}: LeafProps & { options: EnumOption[]; icons?: boolean }) {
  const id = useId();
  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <FieldLabel id={id} label={label} description={description} />
      <ToggleGroup
        id={id}
        type="single"
        variant="outline"
        size="sm"
        disabled={disabled}
        value={JSON.stringify(value)}
        // Clicking the selected option would clear it: a value is always required.
        onValueChange={(raw) => raw && onChange(path, JSON.parse(raw))}
        className="w-full"
      >
        {options.map((option) => {
          const Icon = icons ? OPTION_ICONS[String(option.value)] : undefined;
          return (
            <ToggleGroupItem
              key={JSON.stringify(option.value)}
              value={JSON.stringify(option.value)}
              aria-label={option.label}
              title={option.label}
              className="flex-1 text-xs"
            >
              {Icon ? <Icon className="size-4" /> : option.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </FieldShell>
  );
}

/**
 * Choice among named colors (e.g. the palette): each option is drawn with the
 * color its CSS value resolves to, so it follows the edits of the palette.
 */
function SwatchField({ label, description, node, path, value, onChange, disabled, ctx }: LeafProps & { ctx: Ctx }) {
  const ui = uiOf(node);
  const options = enumOptions(node) ?? [];
  const colorOf = (option: unknown) => {
    const css = cssValue(ui, option);
    const ref = css && /^var\((--[\w-]+)\)$/.exec(css);
    return ref ? ctx.cssVars.get(ref[1]) : (css ?? undefined);
  };
  const selected = options.find((o) => Object.is(o.value, value));

  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel label={label} description={description} />
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{selected?.label}</span>
      </div>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = Object.is(option.value, value);
          return (
            <button
              key={JSON.stringify(option.value)}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.label}
              title={option.label}
              disabled={disabled}
              onClick={() => onChange(path, option.value)}
              className={cn(
                "size-7 rounded-full border shadow-xs ring-offset-2 ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                checked && "ring-2 ring-foreground",
              )}
              style={{ background: colorOf(option.value) }}
            />
          );
        })}
      </div>
    </FieldShell>
  );
}

/**
 * Inclusive range of a number field: exclusive bounds become the closest
 * value a step away, so the slider never offers a rejected value.
 */
function numberRange(node: JsonSchema, step: number) {
  const min = node.minimum ?? (node.exclusiveMinimum !== undefined ? node.exclusiveMinimum + step : undefined);
  const max = node.maximum ?? (node.exclusiveMaximum !== undefined ? node.exclusiveMaximum - step : undefined);
  return { min, max };
}

/** Decimals of a step: 0.05 → 2, so float noise never reaches the value. */
function decimalsOf(step: number) {
  const text = String(step);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

function NumberField({
  label,
  description,
  node,
  path,
  value,
  onChange,
  disabled,
  unit,
  step: uiStep,
}: LeafProps & { unit?: string; step?: number }) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const step = uiStep ?? node.multipleOf ?? (node.type === "integer" ? 1 : 0.01);
  const { min, max } = numberRange(node, step);
  const hasRange = min !== undefined && max !== undefined;
  const current = typeof value === "number" ? value : Number(node.default ?? min ?? 0);
  const invalid = draft !== "" && !isValidValue(node, Number(draft));

  function clamp(n: number) {
    // Snap to the step grid (counted from the minimum), then into the range.
    const origin = min ?? 0;
    let result = Number((origin + Math.round((n - origin) / step) * step).toFixed(decimalsOf(step)));
    if (node.type === "integer") result = Math.round(result);
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <FieldLabel id={id} label={label} description={description} />
      <div className="flex items-center gap-3">
        {hasRange ? (
          <Slider
            aria-label={label}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            value={[current]}
            onValueChange={([n]) => onChange(path, clamp(n))}
            className="flex-1"
          />
        ) : null}
        <div className={cn("relative shrink-0", hasRange ? "w-28" : "w-full")}>
          <Input
            id={id}
            type="number"
            inputMode={node.type === "integer" ? "numeric" : "decimal"}
            min={min}
            max={max}
            step={step}
            value={draft}
            disabled={disabled}
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
            className={cn("font-mono text-xs tabular-nums", unit && "pr-8")}
          />
          {unit ? (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </div>
      </div>
    </FieldShell>
  );
}

function StringField({ label, description, node, path, value, onChange, disabled }: LeafProps) {
  const id = useId();
  const [draft, setDraft, committed] = useDraft(value);
  const invalid = !isValidValue(node, draft);

  return (
    <FieldShell disabled={disabled} className="space-y-2">
      <FieldLabel id={id} label={label} description={description} />
      <Input
        id={id}
        value={draft}
        maxLength={node.maxLength}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          if (isValidValue(node, e.target.value)) onChange(path, e.target.value);
        }}
        onBlur={() => setDraft(committed)}
      />
    </FieldShell>
  );
}
