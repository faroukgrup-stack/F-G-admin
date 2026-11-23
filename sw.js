/* Service Worker - لوحة إدارة مجموعة فاروق V8.0 (Supabase)
 * تخزين مؤقت + إشعارات المواعيد + Web Push (رسائل/مهام/مواعيد/حجوزات) حتى والتطبيق مغلق
 */
const CACHE_NAME = 'farouk-admin-v8-0-1';
const SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './js/fg-config.js',
  './js/fg-bridge.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL).catch(() => {})
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.pathname.includes('/functions/v1/') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('googleusercontent.com')
  ) {
    return;
  }
  // صفحات HTML: الشبكة أولاً حتى تصل التحديثات فوراً، والكاش للعمل دون اتصال
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.includes('/js/fg-')) {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE_NAME).then((ch) => ch.put(event.request, c)).catch(() => {}); }
        return res;
      }).catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res && res.status === 200 && event.request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    const title = data.title || 'تذكير — مجموعة فاروق';
    const options = {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'farouk-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: './index.html' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
  if (data.type === 'SCHEDULE_APPS' && Array.isArray(data.appointments)) {
    event.waitUntil(scheduleFutureNotifications(data.appointments));
  }
});

async function scheduleFutureNotifications(apps) {
  const now = Date.now();
  for (const a of apps) {
    if (!a.date || !a.time || !a.id) continue;
    try {
      const ts = new Date(a.date + 'T' + a.time + ':00').getTime();
      if (isNaN(ts) || ts <= now) continue;
      const tag = 'app-' + a.id;
      const opts = {
        body: a.title + (a.time ? ' — الساعة ' + a.time : ''),
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: tag,
        requireInteraction: true,
        data: { url: './index.html', appId: a.id }
      };
      // Timestamp Trigger إن وُجد (Chrome Android)
      if (typeof TimestampTrigger !== 'undefined') {
        opts.showTrigger = new TimestampTrigger(ts);
        await self.registration.showNotification('موعد قادم — مجموعة فاروق', opts);
      }
    } catch (e) {}
  }
}

/* ===== Web Push من الخادم (Supabase → reminders/admin-core/public-api) ===== */
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'مجموعة فاروق', body: event.data ? event.data.text() : '' }; }
  event.waitUntil((async () => {
    // إذا كانت اللوحة مفتوحة ومرئية فالنافذة المنبثقة داخل الصفحة تكفي (تصل لحظياً)
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = list.some((c) => c.visibilityState === 'visible' && c.focused);
    if (visible) return;
    await self.registration.showNotification(d.title || 'تنبيه — مجموعة فاروق', {
      body: d.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: d.tag || 'fg-push',
      renotify: true,
      requireInteraction: d.priority === 'high',
      vibrate: d.priority === 'high' ? [300, 120, 300, 120, 300] : [200, 100, 200],
      data: { url: './index.html', link: d.link || 'dashboard' }
    });
    try { if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge(); } catch (e) {}
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const link = data.link || '';
  const target = (data.url || './index.html') + (link ? '#fg=' + encodeURIComponent(link) : '');
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
          if (link) c.postMessage({ type: 'FG_NAVIGATE', link });
          return c.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

// تجديد اشتراك Push تلقائياً إذا أبطله المتصفح
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(clients.matchAll({ type: 'window' }).then((list) => list.forEach((c) => c.postMessage({ type: 'FG_RESUBSCRIBE' }))));
});
