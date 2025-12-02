import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantResponse, menuResponse] = await Promise.all([
        axios.get(`/restaurants/${id}`),
        axios.get(`/restaurants/${id}/menu`)
      ]);

      setRestaurant(restaurantResponse.data.restaurant);
      setMenuItems(menuResponse.data.menuItems);
    } catch (error) {
      setError('Failed to load restaurant data');
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading restaurant...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!restaurant) {
    return <div className="error">Restaurant not found</div>;
  }

  // Group menu items by type
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="restaurant-detail">
      <div className="restaurant-header">
        {restaurant.image_url && (
          <img
            src={`http://localhost:3000${restaurant.image_url}`}
            alt={restaurant.name}
            className="restaurant-hero-image"
          />
        )}
        <div className="restaurant-info">
          <h1>{restaurant.name}</h1>
          <p className="restaurant-slogan">{restaurant.slogan}</p>
          <p className="restaurant-address">{restaurant.address}</p>
          <div className="restaurant-hours">
            <span>Open: {restaurant.open_time}</span>
            <span>Close: {restaurant.close_time}</span>
          </div>
        </div>
      </div>

      <div className="menu-section">
        <h2>Menu</h2>

        {Object.keys(groupedMenuItems).length === 0 ? (
          <p className="no-menu">No menu items available</p>
        ) : (
          Object.entries(groupedMenuItems).map(([type, items]) => (
            <div key={type} className="menu-category">
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
              <div className="menu-items">
                {items.map((item) => (
                  <div key={item.id} className="menu-item">
                    {item.image_url && (
                      <img
                        src={`http://localhost:3000${item.image_url}`}
                        alt={item.name}
                        className="menu-item-image"
                      />
                    )}
                    <div className="menu-item-content">
                      <div className="menu-item-info">
                        <h4>{item.name}</h4>
                        {item.abv && <span className="menu-item-abv">{item.abv}% ABV</span>}
                        <p className="menu-item-description">{item.description}</p>
                      </div>
                      <div className="menu-item-price">
                        ${item.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;