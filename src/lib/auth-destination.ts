export type AuthDestination = "/app" | "/business/dashboard";
const key = "kinra:auth-destination";
const lifetime = 60 * 60 * 1000;
type DestinationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
// Only named application destinations are accepted. Never redirect to input URLs.
export function authDestination(value: unknown): AuthDestination {
  return value === "/business/dashboard" ? value : "/app";
}
export function rememberAuthDestination(
  storage: DestinationStorage,
  value: unknown,
  now = Date.now(),
) {
  try {
    if (authDestination(value) === "/business/dashboard")
      storage.setItem(
        key,
        JSON.stringify({ path: "/business/dashboard", expires: now + lifetime }),
      );
    else storage.removeItem(key);
  } catch {
    /* Authentication still works when browser storage is unavailable. */
  }
}
export function readAuthDestination(
  storage: DestinationStorage,
  now = Date.now(),
): AuthDestination {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? "null");
    if (
      saved?.path === "/business/dashboard" &&
      Number.isFinite(saved.expires) &&
      saved.expires > now &&
      saved.expires <= now + lifetime
    )
      return saved.path;
  } catch {
    /* Missing or invalid hints fall back to the personal app. */
  }
  return "/app";
}
export function clearAuthDestination(storage: DestinationStorage) {
  try {
    storage.removeItem(key);
  } catch {
    /* The hint is optional. */
  }
}
