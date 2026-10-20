export interface NotificationStatus {
  configured: boolean;
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  enabled: boolean;
}
export interface NotificationApi {
  status(): Promise<NotificationStatus>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  test(): Promise<void>;
}
export function validPushEndpoint(endpoint: string) {
  if (endpoint.includes("\\") || endpoint.length > 3000) return false;
  try {
    const url = new URL(endpoint);
    return (
      (url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.port &&
        ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(
          url.hostname,
        )) ||
      (url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !url.port &&
        /^[a-z0-9.-]+\.notify\.windows\.com$/.test(url.hostname))
    );
  } catch {
    return false;
  }
}
