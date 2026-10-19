import { Fragment, useSyncExternalStore, type ReactNode } from "react";
import {
  format as dateFormat,
  formatDistanceToNow as distanceToNow,
  type FormatOptions,
} from "date-fns";
import { enUS, bs, de } from "date-fns/locale";
import messages from "@/data/translations.json";

export type Language = "en" | "bs" | "de";
export const languages: Language[] = ["en", "bs", "de"];
export const localeFor = { en: "en-GB", bs: "bs-BA", de: "de-DE" } as const;
const dictionary = messages as Record<string, { en?: string; bs: string; de: string }>;
let language: Language = "en";
let initialized = false;
let revision = 0;
export const languageRevision = () => revision;
const listeners = new Set<() => void>();
let persist: ((next: Language) => void) | undefined;
let pendingChoice: Language | undefined;
export function takePendingLanguage(): Language | undefined {
  let selected = pendingChoice;
  pendingChoice = undefined;
  if (typeof window !== "undefined")
    try {
      const stored = sessionStorage.getItem("kinra:language:pending");
      sessionStorage.removeItem("kinra:language:pending");
      if (isLanguage(stored)) selected = stored;
    } catch {
      /* In-memory choice still works. */
    }
  return selected;
}
export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "bs" || value === "de";
}
function readLanguage(): Language {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("kinra:language");
    if (isLanguage(stored)) return stored;
  } catch {
    /* Private/restricted storage still supports this tab. */
  }
  const requested = navigator.languages?.[0]?.split("-")[0];
  return isLanguage(requested) ? requested : "en";
}
/** Keep the first client render identical to SSR; restore the device choice after hydration. */
export function currentLanguage() {
  return language;
}
export function initializeLanguage() {
  if (initialized || typeof window === "undefined") return;
  setLanguage(readLanguage(), false);
}
export function setLanguage(next: Language, save = true) {
  if (!isLanguage(next)) return;
  initialized = true;
  language = next;
  if (save) revision++;
  if (save && !persist) {
    pendingChoice = next;
    if (typeof window !== "undefined")
      try {
        sessionStorage.setItem("kinra:language:pending", next);
      } catch {
        /* Optional persistence. */
      }
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.documentElement.dir = "ltr";
    try {
      localStorage.setItem("kinra:language", next);
      document.cookie = `kinra_language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      /* The in-memory choice remains usable. */
    }
  }
  listeners.forEach((listener) => listener());
  if (save) persist?.(next);
}
export function registerLanguagePersistence(save: (next: Language) => void) {
  persist = save;
  return () => {
    if (persist === save) persist = undefined;
  };
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useLanguage() {
  const selected = useSyncExternalStore(subscribe, currentLanguage, () => "en" as Language);
  return { language: selected, setLanguage, t };
}
export function message(source: string, selected: Language = currentLanguage()): string {
  return dictionary[source]?.[selected] ?? source;
}
export const hasMessage = (source: string) => Object.hasOwn(dictionary, source);
export const isTranslatedMessage = (source: string) =>
  Object.values(dictionary).some((entry) => entry[currentLanguage()] === source);
export function t(source: string, values: Record<string, unknown> = {}): string {
  return message(source).replace(/\{(\w+)\}/g, (token, key: string) =>
    key in values
      ? typeof values[key] === "number"
        ? number(values[key])
        : String(values[key] ?? "")
      : token,
  );
}
/** React values stay React values; names, notes and other user text are never translated. */
export function Message({
  source,
  values = {},
}: {
  source: string;
  values?: Record<string, ReactNode>;
}) {
  useLanguage();
  return message(source)
    .split(/(\{\w+\})/g)
    .map((part, index) => {
      const match = /^\{(\w+)\}$/.exec(part);
      const value = match ? values[match[1]!] : part;
      return (
        <Fragment key={index}>
          {typeof value === "number" ? number(value) : (value ?? part)}
        </Fragment>
      );
    });
}
export function format(value: Date | number, pattern: string, options?: FormatOptions): string {
  return dateFormat(value, pattern, {
    ...options,
    locale: { en: enUS, bs, de }[currentLanguage()],
  });
}
export function number(value: number, options?: Intl.NumberFormatOptions): string {
  const selected = currentLanguage();
  const requested = localeFor[selected];
  // Some browser ICU versions advertise Bosnian but retain legacy dot decimals.
  // German provides the same comma decimal/dot grouping convention for this fallback.
  const locale =
    selected === "bs" &&
    new Intl.NumberFormat(requested).formatToParts(1.1).find((part) => part.type === "decimal")
      ?.value !== ","
      ? "de-DE"
      : requested;
  return new Intl.NumberFormat(locale, options).format(value);
}
export const dateLocale = () => ({ en: enUS, bs, de })[currentLanguage()];
export function displayNumber(value: string | number): string {
  if (typeof value === "number") return number(value);
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) return value;
  const decimals = value.split(".")[1]?.length ?? 0;
  return number(Number(value), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
export function dateTime(value: Date): string {
  return new Intl.DateTimeFormat(localeFor[currentLanguage()], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
export function formatDistanceToNow(
  value: Date | number,
  options?: { addSuffix?: boolean; includeSeconds?: boolean },
): string {
  return distanceToNow(value, { ...options, locale: { en: enUS, bs, de }[currentLanguage()] });
}
export function countMessage(
  count: number,
  noun: "sessions" | "exercises" | "sets" | "days" | "entries" | "programs",
): string {
  const forms = {
    sessions: {
      en: ["session", "sessions", "sessions"],
      bs: ["trening", "treninga", "treninga"],
      de: ["Einheit", "Einheiten", "Einheiten"],
    },
    exercises: {
      en: ["exercise", "exercises", "exercises"],
      bs: ["vježba", "vježbe", "vježbi"],
      de: ["Übung", "Übungen", "Übungen"],
    },
    sets: {
      en: ["set", "sets", "sets"],
      bs: ["serija", "serije", "serija"],
      de: ["Satz", "Sätze", "Sätze"],
    },
    days: { en: ["day", "days", "days"], bs: ["dan", "dana", "dana"], de: ["Tag", "Tage", "Tage"] },
    entries: {
      en: ["entry", "entries", "entries"],
      bs: ["unos", "unosa", "unosa"],
      de: ["Eintrag", "Einträge", "Einträge"],
    },
    programs: {
      en: ["program", "programs", "programs"],
      bs: ["program", "programa", "programa"],
      de: ["Programm", "Programme", "Programme"],
    },
  };
  const selected = currentLanguage();
  const category = new Intl.PluralRules(localeFor[selected]).select(count);
  const index = category === "one" ? 0 : category === "few" ? 1 : 2;
  return `${number(count)} ${forms[noun][selected][index]}`;
}
export const roleLabel = (role: string | null) =>
  t(role === "trainer" ? "Coach" : role === "client" ? "Client" : "Solo");
