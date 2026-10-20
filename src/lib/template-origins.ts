import { z } from "zod";
import { featureRpc } from "./backend";
export interface TemplateSource {
  id: string;
  version: number;
}
const demoSources = new Map<string, TemplateSource>();
export function registerDemoTemplateSource(target: string, source: TemplateSource) {
  demoSources.set(target, source);
}
export function demoTemplateSource(target: string) {
  return demoSources.get(target);
}
const originSchema = z.array(
  z.object({
    target_id: z.string().uuid(),
    kind: z.enum(["training", "nutrition"]),
    id: z.string(),
    version: z.number().int().positive(),
  }),
);
export async function templateOrigins(ownerId: string) {
  const result = await featureRpc("kinra_template_origins", { expected_owner: ownerId });
  if (result.error) throw new Error(result.error.message);
  return originSchema.parse(result.data);
}
