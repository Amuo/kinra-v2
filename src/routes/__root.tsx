import { useLanguage, initializeLanguage, t, Message } from "@/lib/i18n";
import { clearFieldValidity, invalidField } from "@/lib/i18n-errors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuthIdentityContext } from "@/lib/account-state";
import { installDeploymentRecovery } from "@/lib/deployment-recovery";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          <Message source="Page not found" />
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Message source="This page doesn't exist or has moved." />
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            <Message source="Go home" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  useLanguage();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          <Message source="This page didn't load" />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Message source="Something went wrong. Try refreshing or head back home." />
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            <Message source="Try again" />
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-input px-6 text-sm font-medium text-foreground"
          >
            <Message source="Go home" />
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0f1013" },
      { title: "Kinra — Health, training & wellness in one place" },
      {
        name: "description",
        content:
          "Log training, sleep, nutrition and mood. Coach clients with programs and dashboards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/brand/kinra-icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  useLanguage();
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { language } = useLanguage();
  useEffect(() => initializeLanguage(), []);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    const titles: Record<string, string> = {
      "/": "Kinra — Training, recovery & coaching in one app",
      "/auth": "Sign in — Kinra",
      "/auth/confirm": "Kinra account",
      "/app": "Today — Kinra",
      "/app/train": "Train — Programs & personal records | Kinra",
      "/app/fuel": "Fuel — Kinra",
      "/app/recover": "Recover — Kinra",
      "/app/progress": "Progress — Kinra",
      "/app/programs": "Programs — Kinra",
      "/app/me": "Your profile — Kinra",
      "/app/clients": "Clients — Kinra",
    };
    document.title = t(
      titles[pathname] ??
        (pathname.startsWith("/app/clients/") ? "Client progress — Kinra" : "Kinra"),
    );
  }, [language, pathname]);
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  const [identity, setIdentity] = useState<string | null>();
  const previousIdentity = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    try {
      return installDeploymentRecovery(window, sessionStorage, () => window.location.reload());
    } catch {
      return undefined;
    }
  }, []);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user.id ?? null;
      if (previousIdentity.current !== next) {
        previousIdentity.current = next;
        setIdentity(next);
        void queryClient.cancelQueries();
        queryClient.clear();
        // Do not await Supabase calls from inside its auth notification lock.
        queueMicrotask(() => void router.invalidate());
      } else if (event === "USER_UPDATED") {
        void queryClient.invalidateQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthIdentityContext.Provider value={identity}>
        <div
          className="contents"
          onInvalidCapture={invalidField}
          onInputCapture={clearFieldValidity}
        >
          <Outlet />
        </div>
      </AuthIdentityContext.Provider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
