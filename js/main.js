let restaurants;
let neighborhoods;
let cuisines;
let map;
let markers = [];
let home = window.location.pathname === '/';

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
  setTimeout(function() {
    if (document.querySelector('.loader').style.display !== 'none') {
      let loadingMsg = document.createElement('span');
      loadingMsg.innerText = 'This may take a few seconds';
      document.querySelector('.loader').appendChild(loadingMsg);
    }
  }, 1000);
});

/**
 * Add title to maps iframe.
 */
window.addEventListener('load', () => {
  document.querySelectorAll('iframe')[0].title = 'Restaurant map';
});

/**
 * Register Service Worker.
 */
registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('Service worked registered!');
  }).catch((err) => {
    console.log('Registration failed!');
  });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    if (home) select.append(option);
  });
  document.querySelector('.loader').style.display = 'none';
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    if (home) select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.querySelector('.map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Add event listeners for filter dropdowns.
 */
if (document.getElementById('neighborhoods-select')) {
  document.getElementById('neighborhoods-select').addEventListener('change', () => {
      updateRestaurants();
  });
}

if (document.getElementById('cuisines-select')) {
  document.getElementById('cuisines-select').addEventListener('change', () => {
    updateRestaurants();
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.querySelector('.restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  // self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.querySelector('.restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML...
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const container = document.createElement('div');
  const picture = document.createElement('picture');
  const sourceLg = document.createElement('source');
  const sourceSm = document.createElement('source');
  const image = document.createElement('img');

  sourceLg.className = 'restaurant-img';
  sourceLg.alt = restaurant.name;
  sourceLg.media = "(min-width: 500px)";
  sourceLg.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'lg');
  picture.append(sourceLg);

  sourceSm.className = 'restaurant-img';
  sourceSm.alt = restaurant.name;
  sourceSm.media = "(max-width: 500px)";
  sourceSm.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'sm');
  picture.append(sourceSm);

  image.className = 'restaurant-img';
  image.alt = restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 'lg');
  picture.append(image);

  li.append(picture);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  container.append(name);

  if (restaurant.is_favorite == 'true') {
    name.innerHTML += ' ♥';
  }

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.classList += 'neighborhood';
  container.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  container.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', restaurant.name);
  more.classList += 'btn';
  more.href = DBHelper.urlForRestaurant(restaurant);
  container.append(more)

  li.append(container)

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
