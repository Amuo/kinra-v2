import { createFileRoute } from "@tanstack/react-router";
import { dispatchReminders } from "@/lib/reminder-dispatch.server";

export const Route = createFileRoute("/api/reminders")({
  server: { handlers: { POST: ({ request }) => dispatchReminders(request) } },
});
