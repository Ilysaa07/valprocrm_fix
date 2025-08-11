// Service Worker for handling notifications

const CACHE_NAME = 'valpro-cache-v2';

self.addEventListener('install', (event) => {
  console.log('[SW] installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/notification.mp3',
        '/notification.wav',
        '/valprologo.webp'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activating');
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.map(name => name !== CACHE_NAME ? caches.delete(name) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});

self.addEventListener('push', (event) => {
  console.log('[SW] push received', event);

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Notifikasi Baru',
      body: 'Anda memiliki notifikasi baru',
      icon: '/valprologo.webp',
      badge: '/valprologo.webp',
      url: '/admin/notifications'
    };
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru',
    icon: data.icon || '/valprologo.webp',
    badge: data.badge || '/valprologo.webp',
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: !!data.requireInteraction,
    data: {
      url: data.url || '/admin/notifications',
      id: data.id || null,
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'view', title: 'Lihat' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] notificationclick', event);
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/admin/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      // Try to find existing client
      for (let i = 0; i < windowClients.length; i += 1) {
        const client = windowClients[i];
        // If client is already open, focus and navigate
        if (client.url.includes(urlToOpen)) {
          try {
            client.focus();
            return;
          } catch (e) {
            // ignore
          }
        }
      }
      // If none found - open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] notificationclosed', event);
});
