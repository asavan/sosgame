/* eslint-env serviceworker */

const version = "0.0.1";
const CACHE = "cache-only-" + version;

self.addEventListener("install", function (evt) {
    evt.waitUntil(precache().then(function () {
        return self.skipWaiting();
    }));
});

const deleteCache = async (key) => {
    await caches.delete(key);
};

const deleteOldCaches = async () => {
    const cacheKeepList = [CACHE];
    const keyList = await caches.keys();
    const cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
    await Promise.all(cachesToDelete.map(deleteCache));
};

const deleteAndClaim = async () => {
    await deleteOldCaches();
    await self.clients.claim();
};

self.addEventListener("activate", (event) => {
    event.waitUntil(deleteAndClaim());
});

self.addEventListener("fetch", function (evt) {
    evt.respondWith(networkOrCache(evt.request));
});


function networkOrCache(request) {
    return fetch(request).then(function (response) {
        return response.ok ? response : fromCache(request);
    })
        .catch(function () {
            return fromCache(request);
        });
}

function fromCache(request) {
    return caches.open(CACHE).then(function (cache) {
        return cache.match(request, {ignoreSearch: true}).then(function (matching) {
            return matching || Promise.reject("request-not-in-cache");
        });
    });
}

function precache() {
    const filesToCache = self.__WB_MANIFEST.map((e) => e.url);
    return caches.open(CACHE).then(function (cache) {
        return cache.addAll([
            "./",
            ...filesToCache
        ]);
    });
}
