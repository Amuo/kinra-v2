import { useId } from "react";
import { Globe2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const languages = [
  { value: "en", name: "English" },
  { value: "bs", name: "Bosanski" },
  { value: "de", name: "Deutsch" },
] as const;

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const id = useId();
  return (
    <div className={`kinra-language-selector${compact ? " kinra-language-selector--compact" : ""}`}>
      <label htmlFor={id} className={compact ? "sr-only" : "kinra-language-selector__label"}>
        {t("Language")}
      </label>
      <div className="kinra-language-selector__control">
        <Globe2 aria-hidden="true" className="kinra-language-selector__icon" />
        <select
          id={id}
          name="language"
          value={language}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "en" || value === "bs" || value === "de") setLanguage(value);
          }}
          className="kinra-language-selector__select"
        >
          {languages.map((option) => (
            <option key={option.value} value={option.value} lang={option.value}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
