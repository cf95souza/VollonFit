const CACHE_NAME = 'vollonfit-pwa-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ESTRATÉGIA: NETWORK FIRST (Tenta rede, se falhar usa cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Se for navegação (SPA), tentar servir o index.html
      if (event.request.mode === 'navigate') {
        const indexResponse = await caches.match('/index.html');
        if (indexResponse) {
          return indexResponse;
        }
      }
      
      // Se não encontrar nada, retorna uma resposta vazia para evitar TypeError
      return new Response('Offline / Not Found in Cache', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});

// ESCUTAR NOTIFICAÇÕES PUSH
self.addEventListener('push', (event) => {
  let data = { title: 'VollonFit', body: 'Nova notificação!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'VollonFit', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/icon-512.png',
    badge: '/assets/icon-512.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ABRIR O APP AO CLICAR NA NOTIFICAÇÃO
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
