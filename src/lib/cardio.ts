import { z } from "zod";

/** Canonical measurements. No estimated calories or derived speed is stored. */
export const cardioMetricsSchema = z
  .object({
    duration_seconds: z.number().int().positive().max(86400).optional(),
    distance_m: z.number().finite().positive().max(10_000_000).optional(),
    speed_kmh: z.number().finite().min(0).max(200).optional(),
    incline_percent: z.number().finite().min(-100).max(100).optional(),
  })
  .strict();
export type CardioMetrics = z.infer<typeof cardioMetricsSchema>;
export function cardioMetricsError(value: unknown, required = true): string | null {
  const parsed = cardioMetricsSchema.safeParse(value);
  if (!parsed.success) return "Enter valid cardio measurements in the labelled units.";
  if (
    required &&
    parsed.data.duration_seconds === undefined &&
    parsed.data.distance_m === undefined
  )
    return "Enter an actual duration or distance before completing cardio.";
  return null;
}
export const hasCardioActual = (value: CardioMetrics | undefined) =>
  value !== undefined && cardioMetricsError(value) === null;
