import type { FeatureKind } from "@/lib/feature-types";
export const featureSections: { title: string; description: string; kinds: FeatureKind[] }[] = [
  {
    title: "Daily health",
    description: "Plans, routines and the small things you track.",
    kinds: ["nutrition_plan", "supplement", "habit", "steps", "check_in", "reminder"],
  },
  {
    title: "Your progress",
    description: "Personal targets and measurements, on your terms.",
    kinds: ["goal", "measurement"],
  },
  {
    title: "Private tracking",
    description: "Optional records. Visible only to you.",
    kinds: ["medication", "cycle"],
  },
  {
    title: "Discover people & places",
    description: "Find profiles, facilities and save useful references.",
    kinds: ["expert", "facility", "saved", "review"],
  },
  {
    title: "Community & learning",
    description: "Groups, conversations and source-linked education.",
    kinds: ["group", "post", "article", "report", "block"],
  },
  {
    title: "Appointments & organizations",
    description: "Coordinate requests and organization listings.",
    kinds: ["appointment", "organization", "membership_plan"],
  },
  {
    title: "Make it yours",
    description: "Modules, display preferences and quiet hours.",
    kinds: ["preferences", "notification_preferences"],
  },
];
export const featureNames: Partial<Record<FeatureKind, string>> = {
  nutrition_plan: "Nutrition plans",
  supplement: "Supplements",
  measurement: "Measurements",
  goal: "Goals",
  medication: "Medication",
  cycle: "Cycle journal",
  habit: "Habits",
  steps: "Steps",
  check_in: "Check-ins",
  expert: "Experts",
  facility: "Facilities",
  review: "Reviews",
  saved: "Saved items",
  group: "Groups",
  post: "Community posts",
  article: "Education",
  report: "Reports",
  block: "Blocked accounts",
  appointment: "Appointments",
  organization: "Organizations",
  membership_plan: "Membership listings",
  preferences: "App preferences",
  notification_preferences: "Quiet hours",
  reminder: "Reminders",
};
export const featureHints: Partial<Record<FeatureKind, string>> = {
  supplement:
    "Record your own schedule and dose events. Scheduling does not send device notifications.",
  medication:
    "Optional, private records of your existing regimen. Keep prescribed directions from your clinician.",
  cycle: "Optional private observations. No fertility or diagnostic predictions are made.",
  expert: "Profiles and credential claims are self-reported, not independently verified.",
  appointment:
    "Requests remain pending until the other participant confirms. No payment is collected.",
  membership_plan:
    "Informational pricing listings. Kinra does not process subscriptions or payments.",
  reminder: "Save reminder preferences here. Device notification delivery is not connected.",
  notification_preferences:
    "Store quiet hours and categories. Device notification delivery is not connected.",
  preferences:
    "Choose the modules and display settings you want to use. Bosnian is available for toolkit navigation; other screens and forms remain in English.",
  report: "Private reports are recorded for follow-up. No staffed moderation response is promised.",
};
