import { expect, it, vi } from "vitest";
import type { ReactNode } from "react";
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => () => {},
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));
import { BusinessHomeSection, BusinessLanding } from "@/components/strata/business-landing";
import { act, useEffect, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { setLanguage, currentLanguage, initializeLanguage, Message, useLanguage } from "@/lib/i18n";

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

it.each(["de", "bs"] as const)(
  "keeps delayed Suspense hydration in the server language after restoring %s",
  async (selected) => {
    setLanguage("en", false);
    let delayed = false;
    let ready = false;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    function Content() {
      const { t, number: formatNumber, displayNumber: formatDisplay } = useLanguage();
      if (delayed && !ready) throw pending;
      return (
        <section>
          <h1>{t("Profile")}</h1>
          <Message source="Language" />
          <span>{formatNumber(1.2)}</span>
          <span>{formatDisplay("2.5")}</span>
        </section>
      );
    }
    function Shell() {
      useEffect(() => {
        setLanguage(selected, false);
      }, []);
      return (
        <Suspense fallback={<p>Loading</p>}>
          <Content />
        </Suspense>
      );
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Shell />);
    expect(container.textContent).toBe("ProfileLanguage1.22.5");
    document.body.append(container);
    delayed = true;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Shell />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(currentLanguage()).toBe(selected);
    expect(container.textContent).toBe("ProfileLanguage1.22.5");
    await act(async () => {
      ready = true;
      release();
      await pending;
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe(
      selected === "de" ? "ProfilSprache1,22,5" : "ProfilJezik1,22,5",
    );
    await act(async () => root!.unmount());
    container.remove();
  },
);

it.each([BusinessHomeSection, BusinessLanding])(
  "hydrates public business content before applying the saved language (%#)",
  async (Component) => {
    setLanguage("en", false);
    let delayed = false;
    let ready = false;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    function Content() {
      if (delayed && !ready) throw pending;
      return <Component />;
    }
    function Shell() {
      useEffect(() => {
        setLanguage("de", false);
      }, []);
      return (
        <Suspense fallback={<p>Loading</p>}>
          <Content />
        </Suspense>
      );
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Shell />);
    const serverText = container.textContent;
    document.body.append(container);
    delayed = true;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Shell />, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(currentLanguage()).toBe("de");
    expect(container.textContent).toBe(serverText);
    await act(async () => {
      ready = true;
      release();
      await pending;
    });
    expect(container.textContent).not.toBe(serverText);
    await act(async () => root!.unmount());
    container.remove();
    expect(errors).toEqual([]);
  },
);
