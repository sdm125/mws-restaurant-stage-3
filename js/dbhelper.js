/**
 * Common database helper functions.
 */

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}`;
  }

  /**
   * Cache restaurant JSON in indexDB
   */
  static getLocalDatabase() {
    return idb.open('restaurant-reviews-data', 1, (upgradeDb) => {
      const store = upgradeDb.createObjectStore('restaurant-reviews', { keyPath: 'id' });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const restaurantsData = fetch(`${DBHelper.DATABASE_URL}/restaurants/`)
    .then(response => {
      if (!response.ok) { Error(response.statusText); }
      return response.json();
    })
    .then(restaurants => {
      callback(null, restaurants);
      DBHelper.getLocalDatabase().then((db) => {
        let tx = db.transaction('restaurant-reviews', 'readwrite');
        let restaurantsStore = tx.objectStore('restaurant-reviews');

        for(let restaurant of restaurants) {
          restaurantsStore.put(restaurant);
        }
      })
    })
    .catch(error => {
      // Use restaurant JSON from indexDB if fetch fails
      DBHelper.getLocalDatabase().then((db) => {
        const tx = db.transaction('restaurant-reviews');
        const restaurantsStore = tx.objectStore('restaurant-reviews');

        return restaurantsStore.getAll();
      }).then(restaurants => {
        callback(null, restaurants);
      })
    });
  }

  /**
   * Fetch all reviews for a restaurant.
   */
  static fetchAllRestaurantReviews(id, callback) {
    // fetch all restaurants with proper error handling.
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
    .then(response => {
      if (!response.ok) Error(response.statusText)
      return response.json();
    })
    .then(reviews => {
      callback(null, reviews);
    })
    .catch(error => console.log(error))
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, size) {
    if (restaurant.photograph) {
      if(size === 'sm') {
        return (`/img/${restaurant.photograph}_400.jpg`);
      }
      return (`/img/${restaurant.photograph}_800.jpg`);
    }
    else {
      if(size === 'sm') {
        return (`/img/default_400.jpg`);
      }
      return (`/img/default_800.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Add a restaurant review.
   */
  static addRestaurantReview(restaurant, name, rating, comments) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/`, {
      method: 'post',
      body: JSON.stringify({
        "restaurant_id": restaurant.id,
        "name": name,
        "rating": rating,
        "comments": comments
      })
    }).then(data => {
        if (data.status === 201) location.reload();
        console.log('review created: ', data)
    })
  }

  /**
   * Add restaurant as favorite.
   */
   static addRemoveRestaurantFavorite(restaurant, isFav) {
     fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${isFav}`, {
       method: 'put'
     })
     .then(data => {
        console.log('Favorite restaurant added: ', data)
     })
   }
}
