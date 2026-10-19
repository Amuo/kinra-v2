import { t, hasMessage, isTranslatedMessage, currentLanguage } from "./i18n";

export function errorText(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error ?? "");
  if (/fetch|network|load failed/i.test(value))
    return t("Network error. Check your connection and try again.");
  const seconds = /after (\d+) seconds/i.exec(value);
  if (seconds)
    return t("For security purposes, you can only request this after {seconds} seconds.", {
      seconds: Number(seconds[1]),
    });
  if (/rate.limit|too many|email rate limit/i.test(value))
    return t("Too many requests. Please try again later.");
  if (hasMessage(value) || !value) return t(value || "Something went wrong. Please try again.");
  if (isTranslatedMessage(value)) return value;
  try {
    const issues = JSON.parse(value) as {
      path?: (string | number)[];
      code?: string;
      minimum?: number;
      maximum?: number;
    }[];
    if (Array.isArray(issues) && issues[0]?.code) {
      const issue = issues[0];
      const source = issue.path?.filter((p) => typeof p === "string").join(" · ") ?? "";
      const label = source
        .split(" · ")
        .map((k) => t(k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())))
        .join(" · ");
      const detail =
        issue.code === "too_small" && issue.minimum === 1
          ? t("This field is required.")
          : t("Enter a valid value.");
      return label ? `${label}: ${detail}` : detail;
    }
  } catch {
    /* A plain provider message, not a Zod issue list. */
  }
  // English retains actionable original provider detail; other locales get an actionable generic fallback.
  return currentLanguage() === "en" ? value : t("Something went wrong. Please try again.");
}

export function invalidField(event: React.FormEvent<HTMLElement>) {
  const input = event.target;
  if (
    !(input instanceof HTMLInputElement) &&
    !(input instanceof HTMLTextAreaElement) &&
    !(input instanceof HTMLSelectElement)
  )
    return;
  const validity = input.validity;
  input.setCustomValidity("");
  if (validity.valueMissing) input.setCustomValidity(t("This field is required."));
  else if (validity.typeMismatch) input.setCustomValidity(t("Enter a valid email address."));
  else if (validity.tooShort && "minLength" in input)
    input.setCustomValidity(t("Use at least {min} characters.", { min: input.minLength }));
  else if (validity.tooLong && "maxLength" in input)
    input.setCustomValidity(t("Use at most {max} characters.", { max: input.maxLength }));
  else input.setCustomValidity(t("Enter a valid value."));
}
export function clearFieldValidity(event: React.FormEvent<HTMLElement>) {
  const input = event.target;
  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement ||
    input instanceof HTMLSelectElement
  )
    input.setCustomValidity("");
}
