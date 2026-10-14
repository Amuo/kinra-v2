import { expect, it, vi } from "vitest";
import { installDeploymentRecovery } from "@/lib/deployment-recovery";

it("recovers missing deployment chunks once without creating reload loops", () => {
  const target = new EventTarget();
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const reload = vi.fn();
  const first = installDeploymentRecovery(target, storage, reload, () => 100_000);
  target.dispatchEvent(new Event("error"));
  expect(reload).not.toHaveBeenCalled();
  const event = new Event("vite:preloadError", { cancelable: true });
  target.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(reload).toHaveBeenCalledTimes(1);
  first();
  const second = installDeploymentRecovery(target, storage, reload, () => 110_000);
  const retry = new Event("vite:preloadError", { cancelable: true });
  target.dispatchEvent(retry);
  expect(retry.defaultPrevented).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
  second();
});
