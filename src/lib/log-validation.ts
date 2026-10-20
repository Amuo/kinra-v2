import { z } from "zod";
import { today } from "./stats";
import type { LogTable, LogTables } from "./types";
import { cardioMetricsSchema, hasCardioActual } from "./cardio";

const score = z.number().int().min(1).max(5);
const amount = z.number().finite().min(0).max(1_000_000);
const common = { id: z.string().min(1).optional(), user_id: z.string().optional() };
const date = z.string().date();
const timestamp = z.string().datetime({ offset: true });
const set = z
  .object({
    tracking: z.literal("cardio").optional(),
    cardio: cardioMetricsSchema.optional(),
    exercise: z.string().trim().min(1).max(200),
    reps: z.number().int().min(0).max(10000),
    weight: z.number().finite().min(0).max(2000),
  })
  .superRefine((item, context) => {
    if (item.tracking === "cardio") {
      if (item.reps !== 0 || item.weight !== 0 || !hasCardioActual(item.cardio))
        context.addIssue({
          code: "custom",
          message: "Cardio needs duration or distance and no strength load.",
        });
    } else if (item.cardio !== undefined)
      context.addIssue({
        code: "custom",
        message: "Choose cardio tracking for these measurements.",
      });
  });
const schemas = {
  workouts: z.object({
    ...common,
    title: z.string().trim().min(1).max(200),
    performed_at: timestamp.optional(),
    duration_min: z.number().int().min(1).max(1440).nullable().optional(),
    rpe: z.number().int().min(1).max(10).nullable().optional(),
    notes: z.string().max(10000).nullable().optional(),
    sets: z.array(set).max(1000).default([]),
  }),
  sleep_logs: z.object({
    ...common,
    log_date: date.default(today),
    hours: z.number().finite().min(0).max(24),
    quality: score,
  }),
  nutrition_logs: z.object({
    ...common,
    log_date: date.default(today),
    meal: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(300),
    calories: amount.int(),
    protein: amount,
    carbs: amount,
    fat: amount,
  }),
  journal_entries: z.object({
    ...common,
    created_at: timestamp.optional(),
    mood: score,
    energy: score,
    body: z.string().max(10000).nullable().optional(),
  }),
  body_metrics: z
    .object({
      ...common,
      log_date: date.default(today),
      weight: z.number().finite().gt(0).max(700).nullable().optional(),
      body_fat: z.number().finite().min(0).max(100).nullable().optional(),
    })
    .refine(
      (row) => row.weight != null || row.body_fat != null,
      "Enter a weight or body fat value.",
    ),
};

export function prepareLog<T extends LogTable>(
  table: T,
  row: Partial<LogTables[T]>,
): Partial<LogTables[T]> {
  return schemas[table].parse(row) as unknown as Partial<LogTables[T]>;
}

export async function allPages<T>(
  fetchPage: (offset: number, pageSize: number) => Promise<T[]>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (;;) {
    const page = await fetchPage(rows.length, pageSize);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
