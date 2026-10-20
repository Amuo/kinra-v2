import { z } from "zod";
import type { Me, Role } from "./types";
import type { FeaturePayloads } from "./feature-types";
import { currentLanguage } from "./i18n";
import { accountRoleSchema, coreRole, type AccountRole } from "./workspaces";

export const onboardingAnswers = z
  .object({
    role: z.enum(["solo", "client", "trainer"]).nullable(),
    workspace: accountRoleSchema.nullable().default(null),
    display_name: z.string().max(80),
    goal: z.string().max(160),
    first_action: z
      .enum([
        "workout",
        "food",
        "sleep",
        "connect",
        "plan",
        "overview",
        "program",
        "clients",
        "dashboard",
        "organization",
        "membership",
        "community",
      ])
      .nullable(),
    theme: z.enum(["dark", "light", "system"]),
    language: z.enum(["en", "bs", "de"]),
    timezone: z.string().min(1).max(80),
    gender: z
      .enum(["woman", "man", "non_binary", "another_identity", "prefer_not_to_say"])
      .nullable()
      .default(null),
    height_cm: z.number().finite().min(80).max(250).nullable().default(null),
    weight_kg: z.number().finite().min(20).max(350).nullable().default(null),
    units: z.enum(["metric", "imperial"]).default("metric"),
    experience: z.enum(["new", "some", "experienced"]).nullable().default(null),
    birth_date: z
      .string()
      .refine((value) => {
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          value < "1900-01-01" ||
          value > new Date().toISOString().slice(0, 10)
        )
          return false;
        const parsed = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
      })
      .nullable()
      .default(null),
    activity_level: z.enum(["low", "moderate", "high"]).nullable().default(null),
    city: z.string().max(100).default(""),
    limitations: z.string().max(1000).default(""),
  })
  .strict()
  .superRefine((answers, context) => {
    if (answers.workspace && answers.role && coreRole(answers.workspace) !== answers.role)
      context.addIssue({
        code: "custom",
        path: ["workspace"],
        message: "Choose a workspace that matches your setup path.",
      });
  });
export type OnboardingAnswers = z.infer<typeof onboardingAnswers>;
export const genderLabels = {
  woman: "Woman",
  man: "Man",
  non_binary: "Non-binary",
  another_identity: "Another identity",
  prefer_not_to_say: "Prefer not to say",
} as const;
export const experienceLabels = {
  new: "New to training",
  some: "Some experience",
  experienced: "Experienced",
} as const;
export type OnboardingState = {
  answers: OnboardingAnswers;
  step: number;
  version: number;
  completed_at: string | null;
  updated_at: string;
  units_set?: boolean;
};
// Older four-step drafts resume at the same task after the optional step was added.
export function decodeOnboardingState(
  row: Omit<OnboardingState, "answers"> & { answers: unknown },
): OnboardingState {
  if (row.version !== 1 && row.version !== 2)
    throw new Error("Could not load your setup. Your account is unchanged.");
  return {
    ...row,
    answers: onboardingAnswers.parse(row.answers),
    version: 2,
    units_set: typeof row.answers === "object" && row.answers !== null && "units" in row.answers,
    step: row.version === 1 && row.step >= 2 ? row.step + 1 : row.step,
  };
}
export const startingActions = {
  solo: [
    {
      id: "workout",
      title: "Log my first workout",
      body: "Start a session and record your sets at your own pace.",
      to: "/app/train",
    },
    {
      id: "food",
      title: "Start my food diary",
      body: "Add a meal with portions you can review and change.",
      to: "/app/fuel",
    },
    {
      id: "sleep",
      title: "Build a recovery routine",
      body: "Start with a sleep entry or a short breathing session.",
      to: "/app/recover",
    },
  ],
  client: [
    {
      id: "connect",
      title: "Connect with my coach",
      body: "Open your profile and enter the code your coach shared with you.",
      to: "/app/me",
    },
    {
      id: "plan",
      title: "See my assigned training",
      body: "Find programs your connected coach has assigned to you.",
      to: "/app/train",
    },
    {
      id: "overview",
      title: "Explore my daily overview",
      body: "See your own tracking and any feedback from your coach.",
      to: "/app",
    },
  ],
  trainer: [
    {
      id: "program",
      title: "Build my first program",
      body: "Create a reusable training program, then assign it when a client connects.",
      to: "/app/programs",
    },
    {
      id: "clients",
      title: "Connect my first client",
      body: "Open your client list, then get your coach code from your profile to share yourself.",
      to: "/app/clients",
    },
    {
      id: "dashboard",
      title: "Explore my coaching dashboard",
      body: "See your client overview and the information that helps you follow up.",
      to: "/app",
    },
  ],
} as const;
export function initialOnboarding(
  me: Me,
  preferences?: FeaturePayloads["preferences"],
): OnboardingAnswers {
  const workspace = me.workspace && coreRole(me.workspace) === me.role ? me.workspace : me.role;
  return {
    role: me.role,
    workspace,
    display_name: me.display_name ?? "",
    goal: me.goal ?? "",
    first_action: workspaceStartingActions({ role: me.role, workspace })[0]?.id ?? null,
    theme: preferences?.theme ?? "system",
    language: currentLanguage(),
    timezone: preferences?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
    gender: null,
    height_cm: null,
    weight_kg: null,
    units: preferences?.units ?? "metric",
    experience: null,
    birth_date: null,
    activity_level: null,
    city: "",
    limitations: "",
  };
}
export function chooseOnboardingRole(answers: OnboardingAnswers, role: Role): OnboardingAnswers {
  return {
    ...answers,
    role,
    workspace: role,
    first_action: answers.role === role ? answers.first_action : startingActions[role][0].id,
  };
}
export const organizationStartingActions = [
  {
    id: "organization",
    title: "Set up my organization",
    body: "Open organization tools to create a listing and review staff access.",
    to: "/app/me",
  },
  {
    id: "membership",
    title: "Organize memberships",
    body: "Open organization tools to review joined members and membership records.",
    to: "/app/me",
  },
  {
    id: "community",
    title: "Build my community",
    body: "Open groups to create a public community or invite members privately.",
    to: "/app/me",
  },
] as const;
export function workspaceStartingActions(answers: Pick<OnboardingAnswers, "role" | "workspace">) {
  return answers.workspace === "organization"
    ? organizationStartingActions
    : answers.role
      ? startingActions[answers.role]
      : [];
}
export function chooseOnboardingWorkspace(
  answers: OnboardingAnswers,
  workspace: AccountRole,
): OnboardingAnswers {
  const next = { ...answers, role: coreRole(workspace), workspace };
  return {
    ...next,
    first_action:
      workspace === answers.workspace
        ? answers.first_action
        : workspaceStartingActions(next)[0]!.id,
  };
}
export function onboardingDestination(answers: OnboardingAnswers) {
  if (!answers.role) return null;
  return (
    workspaceStartingActions(answers).find((action) => action.id === answers.first_action) ?? null
  );
}
export function validateOnboarding(answers: OnboardingAnswers, step: number): string | null {
  if (!onboardingAnswers.safeParse(answers).success) return "Enter valid setup details.";
  if (!answers.role) return "Choose how you will use Kinra.";
  if (step >= 1 && !answers.display_name.trim()) return "Enter a name for your profile.";
  if (step >= 3 && !onboardingDestination(answers)) return "Choose your first step.";
  return null;
}
export function resumedOnboardingStep(answers: OnboardingAnswers, stored: number): number {
  if (!answers.role) return 0;
  const step = Math.max(0, Math.min(4, stored));
  if (step > 1 && !answers.display_name.trim()) return 1;
  if (step > 3 && !onboardingDestination(answers)) return 3;
  return step;
}
