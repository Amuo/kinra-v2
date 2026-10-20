import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("keeps the public Business page separate from its protected dashboard", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const landing = router.matchRoutes("/business");
    const dashboard = router.matchRoutes("/business/dashboard");
    expect(landing.at(-1)?.routeId).toBe("/business");
    expect(dashboard.at(-1)?.routeId).toBe("/business_/dashboard");
    // The workspace is a root sibling, so the public marketing page is not rendered around it.
    expect(dashboard.map((m) => m.routeId)).not.toContain("/business");
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
