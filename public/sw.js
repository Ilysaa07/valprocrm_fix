/* Basic service worker for Next.js PWA - MVP cache */
self.addEventListener('install', event => {
	self.skipWaiting()
})

const CACHE_NAME = 'valprocrm-mvp-v2'
const PRECACHE_URLS = [
	'/',
	'/manifest.webmanifest',
	'/logometa.png',
	'/offline.html'
]

self.addEventListener('activate', event => {
	event.waitUntil((async () => {
		await self.clients.claim()
		const keys = await caches.keys()
		await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))
		const cache = await caches.open(CACHE_NAME)
		await cache.addAll(PRECACHE_URLS)
	})())
})

self.addEventListener('fetch', event => {
	const { request } = event
	const url = new URL(request.url)

	if (request.method !== 'GET') return

	// Handle external resources (like Cloudflare Insights) - let them pass through
	if (url.origin !== self.location.origin) {
		// For external resources, just fetch without caching
		event.respondWith(
			fetch(request).catch(() => {
				// If external resource fails, return a basic response instead of error
				return new Response('', { 
					status: 200, 
					statusText: 'OK',
					headers: { 'Content-Type': 'text/plain' }
				})
			})
		)
		return
	}

	// Handle same-origin requests
	if (url.origin === self.location.origin) {
		event.respondWith(
			caches.open(CACHE_NAME).then(async cache => {
				const cached = await cache.match(request)
				const networkFetch = fetch(request)
				networkFetch.then(response => {
					if (response && response.status === 200) {
						cache.put(request, response.clone())
					}
				}).catch(() => {})
				return cached || networkFetch
			})
		)
		return
	}

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(async () => {
				const cache = await caches.open(CACHE_NAME)
				const offline = await cache.match('/offline.html')
				return offline || new Response('Offline', { status: 200 })
			})
		)
	} else {
		event.respondWith(
			fetch(request).catch(() => caches.match(request))
		)
	}
})
