import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatTime, isOpen } from '../utils/timeUtils';
import { useAuth } from '../contexts/AuthContext';
import { SERVER_URL } from '../utils/config';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]); // Items to be added to tab
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({}); // Track quantities by menu item ID
  const [openTab, setOpenTab] = useState(null); // Track user's open tab at this restaurant

  useEffect(() => {
    fetchRestaurantData();
    if (isAuthenticated) {
      fetchPaymentMethods();
      fetchOpenTab();
    }
  }, [id, isAuthenticated]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const [restaurantResponse, menuResponse] = await Promise.all([
        axios.get(`/restaurants/${id}`),
        axios.get(`/restaurants/${id}/menu`)
      ]);

      setRestaurant(restaurantResponse.data.restaurant);
      setMenuItems(menuResponse.data.menuItems);

      // No need to check for existing tabs since tabs are created on order submission
    } catch (error) {
      setError('Failed to load restaurant data');
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payment-methods');
      setPaymentMethods(response.data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const findExistingOpenTab = async () => {
    try {
      const response = await axios.get('/tabs');
      const tabs = response.data.tabs;
      
      // Find open tab at this restaurant
      const openTabAtRestaurant = tabs.find(tab => 
        tab.restaurant_id === parseInt(id) && tab.is_open
      );
      
      return openTabAtRestaurant;
    } catch (error) {
      console.error('Error fetching user tabs:', error);
      return null;
    }
  };

  const fetchOpenTab = async () => {
    try {
      const tab = await findExistingOpenTab();
      setOpenTab(tab);
    } catch (error) {
      console.error('Error fetching open tab:', error);
    }
  };

  const addToOrder = (menuItem, quantity) => {
    if (quantity <= 0) return;

    const existingItem = orderItems.find(item => item.menu_item_id === menuItem.id);
    
    if (existingItem) {
      // Update quantity if item already in order
      setOrderItems(orderItems.map(item => 
        item.menu_item_id === menuItem.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      // Add new item to order
      setOrderItems([...orderItems, {
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity
      }]);
    }
  };

  const updateQuantity = (menuItemId, newQuantity) => {
    setQuantities(prev => ({
      ...prev,
      [menuItemId]: Math.max(1, newQuantity)
    }));
  };

  const removeFromOrder = (menuItemId) => {
    setOrderItems(orderItems.filter(item => item.menu_item_id !== menuItemId));
  };

  const submitOrder = async () => {
    if (orderItems.length === 0) return;

    try {
      setLoading(true);

      // Check if user already has an open tab at this restaurant
      let existingTab = await findExistingOpenTab();
      let tabId;

      if (existingTab) {
        // Use existing open tab
        tabId = existingTab.id;
      } else {
        // Create a new tab for this order
        const tabResponse = await axios.post('/tabs', { restaurant_id: parseInt(id) });
        tabId = tabResponse.data.tab.id;
        // Update the openTab state with the new tab
        setOpenTab(tabResponse.data.tab);
      }

      // Add all items to the tab
      for (const item of orderItems) {
        await axios.post(`/tabs/${tabId}/items`, {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity
        });
      }

      // Clear the order and navigate to the tab
      setOrderItems([]);
      navigate(`/tabs/${tabId}`);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit order');
      console.error('Error submitting order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
      {restaurant.image_url && (
        <img
          src={`${SERVER_URL}${restaurant.image_url}`}
          alt={restaurant.name}
          className="restaurant-hero-image"
        />
      )}
      <div className="restaurant-info">
        <div className="restaurant-title">
          <h1>{restaurant.name}</h1>
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

      {isAuthenticated && openTab && (
        <div className="open-tab-notice">
          <p>You have an open tab at this restaurant.</p>
          <button onClick={() => navigate(`/tabs/${openTab.id}`)} className="view-tab-btn">
            View Your Tab
          </button>
        </div>
      )}

      {isAuthenticated && paymentMethods.length === 0 && (
        <div className="payment-method-notice">
          <p>To place orders, you need to add a payment method first.</p>
          <button onClick={() => navigate('/profile')} className="add-payment-btn">
            Add Payment Method
          </button>
        </div>
      )}

      {isAuthenticated && orderItems.length > 0 && (
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-items">
            {orderItems.map((item) => (
              <div key={item.menu_item_id} className="order-item">
                <div className="order-item-info">
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-quantity">Qty: {item.quantity}</span>
                </div>
                <div className="order-item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button 
                  onClick={() => removeFromOrder(item.menu_item_id)}
                  className="remove-item-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Total: ${getOrderTotal().toFixed(2)}</strong>
          </div>
          <button 
            onClick={submitOrder}
            disabled={loading}
            className="submit-order-btn"
          >
            {loading ? 'Submitting...' : openTab ? 'Add to Tab' : 'Start Tab'}
          </button>
        </div>
      )}

      <div className="menu-section">
        <h2>Menu</h2>

        {Object.keys(groupedMenuItems).length === 0 ? (
          <p className="no-menu">No menu items available</p>
        ) : (
          Object.entries(groupedMenuItems).map(([type, items]) => (
            <div key={type} className="menu-category">
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
              <div className="menu-items">
                {items.map((item) => {
                  const quantity = quantities[item.id] || 1;
                  
                  return (
                    <div key={item.id} className="menu-item">
                      {item.image_url && (
                        <img
                          src={`${SERVER_URL}${item.image_url}`}
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
                        {isAuthenticated && (
                          <div className="menu-item-order">
                            <div className="quantity-controls">
                              <button 
                                type="button" 
                                onClick={() => updateQuantity(item.id, quantity - 1)}
                                className="quantity-btn"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="quantity-input"
                              />
                              <button 
                                type="button" 
                                onClick={() => updateQuantity(item.id, quantity + 1)}
                                className="quantity-btn"
                              >
                                +
                              </button>
                            </div>
                            <button 
                              onClick={() => addToOrder(item, quantity)}
                              className="add-to-order-btn"
                              disabled={paymentMethods.length === 0}
                              title={paymentMethods.length === 0 ? "Add a payment method to place orders" : ""}
                            >
                              Add to Order
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;