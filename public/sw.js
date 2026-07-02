const CACHE = "vibefocus-shell-v1"
const SHELL = ["/", "/login", "/offline", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET" || request.url.includes("/rest/") || request.url.includes("/auth/") || request.url.includes("/api/")) return
  event.respondWith(fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match("/offline"))))
})

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "VibeFocus", body: "Time to focus." }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/favicon.ico", data: { url: data.url || "/dashboard" } }))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data.url))
})
