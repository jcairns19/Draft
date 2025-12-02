import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatTime, isOpen } from '../utils/timeUtils';
import './Restaurants.css';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('/restaurants');
      setRestaurants(response.data.restaurants);
    } catch (error) {
      setError('Failed to load restaurants');
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading restaurants...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="restaurants">
      <div className="restaurants-header">
        <h1>Restaurants</h1>
        <p>Discover great places to eat</p>
      </div>

      <div className="restaurants-grid">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            to={`/restaurants/${restaurant.id}`}
            className="restaurant-card"
          >
            {restaurant.image_url && (
              <img
                src={`http://localhost:3000${restaurant.image_url}`}
                alt={restaurant.name}
                className="restaurant-image"
              />
            )}
            <div className="restaurant-info">
              <div className="restaurant-header">
                <h3>{restaurant.name}</h3>
                <span className={`status-chip ${isOpen(restaurant.open_time, restaurant.close_time) ? 'open' : 'closed'}`}>
                  {isOpen(restaurant.open_time, restaurant.close_time) ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="restaurant-slogan">{restaurant.slogan}</p>
              <p className="restaurant-address">{restaurant.address}</p>
              <div className="restaurant-hours">
                <span>Open: {formatTime(restaurant.open_time)}</span>
                <span>Close: {formatTime(restaurant.close_time)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Restaurants;