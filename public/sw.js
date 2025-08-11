// Service Worker for handling notifications

// Cache name for offline support
const CACHE_NAME = 'valpro-cache-v1';

// Install event - cache important files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
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
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push messages
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  let notificationData = {};
  
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Notifikasi Baru',
      body: 'Anda memiliki notifikasi baru',
      icon: '/valprologo.webp',
      badge: '/valprologo.webp'
    };
  }
  
  const title = notificationData.title || 'Notifikasi Baru';
  const options = {
    body: notificationData.body || 'Anda memiliki notifikasi baru',
    icon: notificationData.icon || '/valprologo.webp',
    badge: notificationData.badge || '/valprologo.webp',
    vibrate: [200, 100, 200],
    data: {
      url: notificationData.url || '/admin/notifications'
    },
    actions: [
      {
        action: 'view',
        title: 'Lihat'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle notification click - open appropriate URL
  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/admin/notifications';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          // If so, focus it
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});