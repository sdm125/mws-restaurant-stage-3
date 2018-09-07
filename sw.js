self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('restaurant-reviews-v4').then(function(cache) {
      return cache.addAll([
        '/',
        '/restaurant.html',
        'js/scripts.min.js',
        'css/styles.css',
        'img/1_400.jpg',
        'img/2_400.jpg',
        'img/3_400.jpg',
        'img/4_400.jpg',
        'img/5_400.jpg',
        'img/6_400.jpg',
        'img/7_400.jpg',
        'img/8_400.jpg',
        'img/9_400.jpg',
        'img/10_400.jpg',
        'img/default_400.jpg',
        'img/1_800.jpg',
        'img/2_800.jpg',
        'img/3_800.jpg',
        'img/4_800.jpg',
        'img/5_800.jpg',
        'img/6_800.jpg',
        'img/7_800.jpg',
        'img/8_800.jpg',
        'img/9_800.jpg',
        'img/10_800.jpg',
        'img/default_800.jpg',
      ]);
    }).catch(function(err){
      return err;
    })
  );
});

self.addEventListener('activate', function(event) {
  caches.delete('restaurant-reviews-v3').then(function(cache){
    return cache;
  }).catch(function(err){
    return err;
  })
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(err){
      return err;
    })
  );
});
