const CACHE_NAME = 'barcode-toolbox-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css', // Asegúrate de que este sea el path correcto
  './js/script.js',   // Asegúrate de que este sea el path correcto
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
  // Agrega aquí cualquier otra imagen, fuente, etc. que quieras cachear
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto!');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but in this case, we only want to remove caches that are
          // old versions when a new version of the app is deployed
          return cacheName !== CACHE_NAME && cacheName.startsWith('barcode-toolbox-cache-');
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
