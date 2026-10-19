import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function fieldLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable ||
    schema instanceof z.ZodDefault
  )
    return unwrap(schema._def.innerType);
  if (schema instanceof z.ZodEffects) return unwrap(schema._def.schema);
  return schema;
}
export function initialValue(schema: z.ZodTypeAny): unknown {
  const parsed = schema.safeParse(undefined);
  if (parsed.success) return parsed.data;
  const base = unwrap(schema);
  if (base instanceof z.ZodObject)
    return Object.fromEntries(
      Object.entries(base.shape).map(([key, value]) => [key, initialValue(value as z.ZodTypeAny)]),
    );
  if (base instanceof z.ZodArray) return [];
  if (base instanceof z.ZodRecord) return {};
  if (base instanceof z.ZodBoolean) return false;
  if (base instanceof z.ZodEnum) return base.options[0];
  if (base instanceof z.ZodNumber) return undefined;
  return "";
}

export function SchemaFields({
  schema,
  value,
  onChange,
  path = "record",
}: {
  schema: z.ZodTypeAny;
  value: unknown;
  onChange: (v: unknown) => void;
  path?: string;
}) {
  const base = unwrap(schema);
  if (!(base instanceof z.ZodObject)) return null;
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    <div className="space-y-4">
      {Object.entries(base.shape).map(([key, definition]) => (
        <SchemaField
          key={key}
          name={key}
          schema={definition as z.ZodTypeAny}
          value={record[key]}
          path={`${path}.${key}`}
          onChange={(v) => onChange({ ...record, [key]: v })}
        />
      ))}
    </div>
  );
}

function SchemaField({
  name,
  schema,
  value,
  onChange,
  path,
}: {
  name: string;
  schema: z.ZodTypeAny;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
}) {
  const base = unwrap(schema);
  const title = fieldLabel(name);
  const optional = schema.isOptional();
  const inputClass = "h-12 w-full rounded-tile border border-input bg-surface px-3 text-body";
  if (base instanceof z.ZodRecord) {
    const choices =
      name === "modules"
        ? [
            "train",
            "fuel",
            "recover",
            "progress",
            "supplements",
            "medication",
            "cycle",
            "community",
          ]
        : ["training", "nutrition", "supplements", "appointments", "community"];
    const flags = (value ?? {}) as Record<string, boolean>;
    return (
      <fieldset className="space-y-2">
        <legend className="mb-2 text-label font-semibold">{title}</legend>
        {choices.map((key) => (
          <label
            key={key}
            className="flex min-h-11 items-center justify-between rounded-tile bg-surface px-3"
          >
            <span>{fieldLabel(key)}</span>
            <input
              type="checkbox"
              className="size-5"
              checked={flags[key] ?? true}
              onChange={(e) =>
                onChange({
                  ...Object.fromEntries(choices.map((c) => [c, flags[c] ?? true])),
                  [key]: e.target.checked,
                })
              }
            />
          </label>
        ))}
      </fieldset>
    );
  }
  if (name === "weekdays") {
    const days = Array.isArray(value) ? (value as number[]) : [];
    return (
      <fieldset>
        <legend className="mb-2 text-label font-semibold">Days of week</legend>
        <div className="flex flex-wrap gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <Button
              key={day}
              type="button"
              variant={days.includes(i) ? "volt" : "glass"}
              aria-pressed={days.includes(i)}
              onClick={() =>
                onChange(days.includes(i) ? days.filter((d) => d !== i) : [...days, i])
              }
            >
              {day}
            </Button>
          ))}
        </div>
      </fieldset>
    );
  }
  if (base instanceof z.ZodArray) {
    const values = Array.isArray(value) ? value : [];
    return (
      <fieldset className="space-y-3 rounded-tile border border-border p-3">
        <legend className="px-1 text-label font-semibold">{title}</legend>
        {values.map((item, index) => (
          <div key={index} className="space-y-2 border-b border-border pb-3">
            <div className="flex items-center justify-between">
              <span className="text-caption text-muted-foreground">
                {title} · {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${title} ${index + 1}`}
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <SchemaField
              name={base.element instanceof z.ZodObject ? "Details" : "Value"}
              schema={base.element}
              value={item}
              path={`${path}.${index}`}
              onChange={(v) => onChange(values.map((old, i) => (i === index ? v : old)))}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="glass"
          className="h-11 w-full"
          onClick={() => onChange([...values, initialValue(base.element)])}
        >
          <Plus className="size-4" />
          Add {title.toLowerCase()}
        </Button>
      </fieldset>
    );
  }
  if (base instanceof z.ZodObject)
    return (
      <fieldset className="rounded-tile border border-border p-3">
        <legend className="px-1 text-label font-semibold">{title}</legend>
        <SchemaFields schema={base} value={value} path={path} onChange={onChange} />
      </fieldset>
    );
  if (base instanceof z.ZodBoolean)
    return (
      <label className="flex min-h-12 items-center justify-between gap-3 rounded-tile bg-surface px-3 text-label">
        <span>{title}</span>
        <input
          type="checkbox"
          className="size-5 accent-lime-400"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  const label = (
    <span className="mb-1.5 block text-label font-semibold">
      {title}
      {optional ? <span className="ml-1 font-normal text-muted-foreground">· optional</span> : null}
    </span>
  );
  if (base instanceof z.ZodEnum)
    return (
      <label className="block">
        {label}
        <select
          aria-label={title}
          id={path}
          className={inputClass}
          value={String(value ?? base.options[0])}
          onChange={(e) => onChange(e.target.value)}
        >
          {base.options.map((v: string) => (
            <option key={v} value={v}>
              {fieldLabel(v)}
            </option>
          ))}
        </select>
      </label>
    );
  const isNumber = base instanceof z.ZodNumber;
  const isTimestamp = /_at$|_until$/.test(name);
  const isTime = /(^time$|_start$|_end$)/.test(name);
  const isDate = /(^date$|_date$|_on$|Date$)/.test(name);
  const isLong = /description|notes|body|bio|content|reason/i.test(name);
  const change = (text: string) =>
    onChange(
      text === "" && optional
        ? undefined
        : isNumber
          ? text === ""
            ? undefined
            : Number(text)
          : text,
    );
  return (
    <label className="block">
      {label}
      {isLong ? (
        <Textarea
          aria-label={title}
          id={path}
          className="min-h-24 bg-surface text-body"
          value={String(value ?? "")}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <Input
          aria-label={title}
          id={path}
          type={
            isNumber
              ? "number"
              : isDate
                ? "date"
                : isTimestamp
                  ? "datetime-local"
                  : isTime
                    ? "time"
                    : "text"
          }
          step={isNumber ? "any" : undefined}
          className={inputClass}
          value={String(value ?? "")}
          onChange={(e) => change(e.target.value)}
        />
      )}
    </label>
  );
}
