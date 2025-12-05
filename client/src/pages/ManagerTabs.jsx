import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import './ManagerTabs.css';

const ManagerTabs = () => {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagerTabs();

    // Listen for real-time tab updates
    if (socket) {
      const handleTabUpdate = async (data) => {
        console.log('Received manager tab update:', data);
        // Fetch the latest tab data instead of just refreshing all tabs
        try {
          const response = await axios.get('/restaurants/manager/tabs', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTabs(response.data);
        } catch (error) {
          console.error('Error fetching updated tabs:', error);
        }
      };

      socket.on('manager_tab_updated', handleTabUpdate);

      return () => {
        socket.off('manager_tab_updated', handleTabUpdate);
      };
    }
  }, [socket]);

  const fetchManagerTabs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/restaurants/manager/tabs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTabs(response.data);
    } catch (error) {
      console.error('Error fetching manager tabs:', error);
      setError('Failed to load tabs');
    } finally {
      setLoading(false);
    }
  };

  const toggleServedStatus = async (tabId, itemId, currentServed) => {
    try {
      await axios.patch(`/tabs/${tabId}/items/${itemId}/served`, {
        served: !currentServed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state - find and update the specific tab item
      setTabs(tabs.map(restaurant => ({
        ...restaurant,
        tabs: restaurant.tabs.map(tab => {
          // Check if this tab contains the item we're updating
          if (tab.id === tabId) {
            return {
              ...tab,
              tab_items: tab.tab_items ? tab.tab_items.map(item =>
                item.id === itemId ? { ...item, served: !currentServed } : item
              ) : []
            };
          }
          return tab;
        })
      })));
    } catch (error) {
      console.error('Error updating served status:', error);
      setError('Failed to update served status');
    }
  };

  if (loading) return <div className="loading">Loading tabs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="manager-tabs">
      <h1>Manager Tabs</h1>

      {tabs.length === 0 ? (
        <p>No open tabs found.</p>
      ) : (
        tabs.map(restaurant => (
          <div key={restaurant.id} className="restaurant-section">
            <h2>{restaurant.name}</h2>

            {restaurant.tabs.length === 0 ? (
              <p>No open tabs for this restaurant.</p>
            ) : (
              restaurant.tabs.map(tab => (
                <div key={tab.id} className="tab-card">
                  <div className="tab-header">
                    <h3>Tab #{tab.id}</h3>
                    <span className="tab-status">Status: {tab.is_open ? 'Open' : 'Closed'}</span>
                  </div>

                  <div className="tab-items">
                    {tab.tab_items.map(item => (
                      <div key={item.id} className="tab-item">
                        <div className="item-info">
                          <span className="item-name">{item.menu_item.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                          <span className="item-price">${item.price.toFixed(2)}</span>
                        </div>

                        <div className="item-actions">
                          <label className="served-checkbox">
                            <input
                              type="checkbox"
                              checked={item.served}
                              onChange={() => toggleServedStatus(tab.id, item.id, item.served)}
                            />
                            Served
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="tab-total">
                    Total: ${tab.tab_items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ManagerTabs;