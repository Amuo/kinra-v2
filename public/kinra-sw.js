/* Notifications contain generic text, never a reminder's health details. */
self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data.json();
  } catch {
    data = {};
  }
  const messages = {
    en: "Time for your Kinra reminder. Open the app to see it.",
    bs: "Vrijeme je za vaš Kinra podsjetnik. Otvorite aplikaciju za detalje.",
    de: "Zeit für deine Kinra-Erinnerung. Öffne die App für die Details.",
  };
  event.waitUntil(
    self.registration.showNotification("Kinra", {
      body: messages[data.locale] || messages.en,
      icon: "/brand/apple-touch-icon.png",
      tag: data.id || "kinra-reminder",
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find(
        (window) => new URL(window.url).origin === self.location.origin,
      );
      if (existing) {
        await existing.navigate("/app");
        return existing.focus();
      }
      return clients.openWindow("/app");
    }),
  );
});
