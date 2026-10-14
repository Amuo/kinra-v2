/** Recover an open tab after a release removes its old lazy-loaded assets. */
export function installDeploymentRecovery(
  target: EventTarget,
  storage: Pick<Storage, "getItem" | "setItem">,
  reload: () => void,
  now = Date.now,
) {
  let attempted = false;
  const handler = (event: Event) => {
    if (attempted) return;
    const time = now();
    try {
      const previous = Number(storage.getItem("kinra:asset-reload"));
      if (previous > 0 && time - previous < 60_000) return;
      storage.setItem("kinra:asset-reload", String(time));
    } catch {
      // Storage unavailable: leave the normal error screen available instead of looping.
      return;
    }
    attempted = true;
    event.preventDefault();
    reload();
  };
  target.addEventListener("vite:preloadError", handler);
  return () => target.removeEventListener("vite:preloadError", handler);
}
