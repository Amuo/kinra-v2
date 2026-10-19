import { expect, it } from "vitest";
import { act, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { currentLanguage, initializeLanguage, Message, useLanguage } from "@/lib/i18n";

it("hydrates the English server output before restoring a saved German device preference", async () => {
  localStorage.setItem("kinra:language", "de");
  expect(currentLanguage()).toBe("en");
  function Page() {
    const { language, t } = useLanguage();
    useEffect(() => initializeLanguage(), []);
    return (
      <main lang={language}>
        <h1>{t("Profile")}</h1>
        <Message source="Language" />
      </main>
    );
  }
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Page />);
  expect(container.textContent).toBe("ProfileLanguage");
  document.body.append(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <Page />, { onRecoverableError: (e) => errors.push(e) });
  });
  expect(errors).toEqual([]);
  expect(container.textContent).toBe("ProfilSprache");
  expect(container.querySelector("main")).toHaveAttribute("lang", "de");
  expect(localStorage.getItem("kinra:language")).toBe("de");
  await act(async () => root!.unmount());
  container.remove();
});
