let restaurant;
let mapInfo;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Initialize Google map, called from HTML.
 */
if(window.location.pathname === '/restaurant.html') {
  window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        self.mapInfo = new google.maps.Map(document.querySelector('.map'), {
          zoom: 16,
          center: restaurant.latlng,
          scrollwheel: false
        });
        fillBreadcrumb();
        DBHelper.mapMarkerForRestaurant(self.restaurant, self.mapInfo);
      }
    });
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Returns heart element
 */
buildHeart = () => {
  let heart = document.createElement('span');
  heart.textContent = " ♥";
  heart.classList += 'heart';

  return heart;
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.querySelector('.restaurant-name');
  if (restaurant.is_favorite == 'true') {
    name.innerHTML = restaurant.name;
    name.appendChild(buildHeart());
    document.querySelector('.remove-fav').style.display = 'inline';
    document.querySelector('.add-fav').style.display = 'none';
  }
  else {
    name.innerHTML = restaurant.name;
    document.querySelector('.remove-fav').style.display = 'none';
    document.querySelector('.add-fav').style.display = 'inline';
  }

  const address = document.querySelector('.restaurant-address span');
  address.innerHTML = restaurant.address;

  const sourceLg = document.createElement('source');
  const sourceSm = document.createElement('source');
  const defaultImg = document.createElement('img');
  const image = document.querySelector('.restaurant-img');

  sourceLg.className = 'restaurant-img';
  sourceLg.alt = restaurant.name;
  sourceLg.media = "(min-width: 500px)";
  sourceLg.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'lg');
  image.append(sourceLg);

  sourceSm.className = 'restaurant-img';
  sourceSm.alt = restaurant.name;
  sourceSm.media = "(max-width: 500px)";
  sourceSm.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'sm');
  image.append(sourceSm);

  defaultImg.className = 'restaurant-img';
  defaultImg.alt = restaurant.name;
  defaultImg.src = DBHelper.imageUrlForRestaurant(restaurant, 'lg');
  image.append(defaultImg);

  const cuisine = document.querySelector('.restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.querySelector('.restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Fetch all reviews and add them to the webpage.
 */
fillReviewsHTML = () => {
  DBHelper.fetchRestaurantReviews(self.restaurant.id, (err, reviews) => {
    const container = document.querySelector('.reviews-container div');

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }

    const ul = document.querySelector('.reviews-list');

    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });

    container.appendChild(ul);
  })
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  let reviewDate = new Date(review.createdAt);
  let stars = "";

  name.innerHTML = review.name;
  name.classList += 'review-name';
  li.appendChild(name);

  const date = document.createElement('div');

  date.innerHTML = `${months[reviewDate.getMonth()]} ${reviewDate.getDate()}, ${reviewDate.getFullYear()}`;
  date.classList += 'date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.classList += 'gold-star';

  for(let star = 0; star < parseInt(review.rating); star++) {
    stars += "★";
  }

  rating.innerHTML = `${stars}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.querySelector('.breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Get review from form.
 */
getReviewFormData = (callback) => {
  let name = document.querySelector('input[name="name"]').value;
  let rating = document.querySelector('input[name="rating"]').value
  let comments = document.querySelector('textarea[name="comments"]').value;

  callback(null, {name, rating, comments});
}

/**
 * Highlight all stars gold before and including star that is clicked. Mark
 * all stars after clicked star black.
 */
(() => {
  let stars = document.querySelectorAll('.star-container .star');
  let ratingInput = document.querySelector('input[name="rating"]');
  stars.forEach((star, index) => {
    if(star.style.color === "" || this.style.color === "#000") {
      star.addEventListener('click', () => {
        ratingInput.value = star.getAttribute('data-rating');
        for(let gold = index; gold >= 0; gold--) {
          stars[gold].style.color = "gold";
        }

        for(let black = index + 1; black < stars.length; black++) {
          stars[black].style.color = "#000";
        }
      });
    }
    else {
      this.style.color = "#000";
    }
  })
})();

if(document.querySelector('.add-review')){
  /**
   * Show review form
   */
  document.querySelector('.add-review').addEventListener('click', () => {
    document.querySelector('.reviews-container form').classList.toggle('hide');
  });

  /**
   * Submit review
   */
  document.querySelector('.submit-review').addEventListener('click', (e) => {
    e.preventDefault();

    fetchRestaurantFromURL((err, restaurant) => {
      getReviewFormData((err, data) => {
        if (data.name !== "" && data.rating !== "" && data.comments !== "") {
          DBHelper.addRestaurantReview(restaurant, data.name, data.rating, data.comments);
        }
        else {
          alert("Please fill in all review form fields.");
        }
      });
    });
  });

  /**
   * Update server with offline reviews
   */
  window.addEventListener('online', ()=> {
    DBHelper.uploadOfflineReviews();
  })

  /**
   * Add favorite restaurant
   */
  document.querySelector('.add-fav').addEventListener('click', (e) => {
    e.preventDefault();

    document.querySelector('.remove-fav').style.display = 'inline';
    document.querySelector('.add-fav').style.display = 'none';

    document.querySelector('.restaurant-name').append(buildHeart());

    fetchRestaurantFromURL((err, restaurant) => {
      DBHelper.addRemoveRestaurantFavorite(restaurant, true);
    });
  });

  /**
   * Add favorite restaurant
   */
  document.querySelector('.remove-fav').addEventListener('click', (e) => {
    e.preventDefault();

    document.querySelector('.add-fav').style.display = 'inline';
    document.querySelector('.remove-fav').style.display = 'none';
    document.querySelector('.heart').remove();

    fetchRestaurantFromURL((err, restaurant) => {
      DBHelper.addRemoveRestaurantFavorite(restaurant, false);
    });
  });

  document.querySelector('.remove-fav').addEventListener('click', (e) => {
    e.preventDefault();

    document.querySelector('.add-fav').style.display = 'inline';
    document.querySelector('.remove-fav').style.display = 'none';
    document.querySelector('.heart').remove();

    fetchRestaurantFromURL((err, restaurant) => {
      DBHelper.addRemoveRestaurantFavorite(restaurant, false);
    });
  });
}
