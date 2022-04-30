const APP_PREFIX = 'budgetpwa-';
const VERSION = 'v1';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = APP_PREFIX + 'data-' + VERSION;

const FILES_TO_CACHE = [
	'/',
	'./index.html',
	'./css/styles.css',
	'./js/index.js',
	'./manifest.json',
	'./icons/icon-72x72.png',
	'./icons/icon-96x96.png',
	'./icons/icon-128x128.png',
	'./icons/icon-144x144.png',
	'./icons/icon-152x152.png',
	'./icons/icon-192x192.png',
	'./icons/icon-384x384.png',
	'./icons/icon-512x512.png',
];

// Create cache with name CACHE_NAME and add FILES_TO_CACHE in it
self.addEventListener('install', function (event) {
	// Perform install steps
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('installing cache: ' + CACHE_NAME);
			return cache.addAll(FILES_TO_CACHE);
		})
	);
});

// Respond with cached resources
self.addEventListener('fetch', function (event) {
	console.log('fetch request : ' + event.request.url);

	// Check if the intercepted request is a request to /api routes
	if (event.request.url.includes('/api/')) {
		event.respondWith(
			// Create/Open cache with name DATA_CACHE_NAME
			caches
				.open(DATA_CACHE_NAME)
				.then((cache) => {
					console.log('cache', cache);
					// Fetch the get request
					return fetch(event.request)
						.then((res) => {
							// If the response was good, clone it and store it in the cache
							if (res.status === 200) {
								cache.put(event.request.url, res.clone());
								console.log(
									'Data requested from ' +
										event.request.url +
										' was successfully fetched and stored to ' +
										DATA_CACHE_NAME
								);
							}
							return res;
						})
						.catch((err) => {
							// If the request failed, try to get it from the cache
							console.log(
								'Network request to ' +
									event.request.url +
									' failed. Trying to get data from the cache instead.'
							);
							return cache
								.match(event.request)
								.then((cachedData) => cachedData || 'No cached data found')
								.catch((err) => console.log(err));
						});
				})
				.catch((err) => console.log(err))
		);
		return;
	}

	// If the intercepted request is not a request to a /api route, then respond with cached resources
	event.respondWith(
		// Check if cache is available
		caches
			.match(event.request)
			.then((cachedFile) => {
				// If file is cached, then respond with it
				// if (cachedFile) {
				// 	console.log('Responding with cached file:', cachedFile);
				// 	return cachedFile;
				// }
				// // If the file is not cached, then try fetching the request
				// else {
				// 	console.log('File is not cached, fetching : ' + event.request.url);
				// 	return fetch(event.request);
				// }

				// More elegant way, omitting the console.logs and if/else:
				return cachedFile || fetch(event.request);
			})
			.catch((err) => console.log(err))
	);
});

// Delete outdated caches
self.addEventListener('activate', function (event) {
	event.waitUntil(
		caches.keys().then((keyList) => {
			// Create a list with all the cache names that have APP_PREFIX
			let cacheKeepList = keyList.filter((key) => key.indexOf(APP_PREFIX));
			// Add current CACHE_NAME to the list
			cacheKeepList.push(CACHE_NAME);

			// Clean up the keyList
			return Promise.all(
				keyList.map((key, idx) => {
					// if the cache name (key) is not in our cacheKeepList, delete it
					if (cacheKeepList.indexOf(key) === -1) {
						console.log('Deleting cache', keyList[idx]);
						return caches.delete(keyList[idx]);
					}
				})
			);
		})
	);
});
