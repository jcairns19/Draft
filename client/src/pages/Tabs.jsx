import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import './Tabs.css';

const Tabs = () => {
  const { token, isManager } = useAuth();
  const { socket } = useSocket();
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('📊 Tabs state changed:', tabs);
    console.log('📊 Tabs length:', tabs.length);
  }, [tabs]);

  useEffect(() => {
    fetchTabs();

    // Listen for real-time tab updates
    if (socket) {
      console.log('🔧 Setting up tab update event listener');

      const handleTabUpdate = async (data) => {
        console.log('🎯 TAB UPDATE RECEIVED:', data);
        console.log('🔄 Refreshing tabs data...');
        // Fetch the latest tab data
        try {
          await fetchTabs();
          console.log('✅ Tabs data refreshed');
        } catch (error) {
          console.error('❌ Error fetching updated tabs:', error);
        }
      };

      // Managers listen to manager_tab_updated, customers might listen to different events
      // For now, both listen to manager_tab_updated for simplicity
      socket.on('manager_tab_updated', handleTabUpdate);
      console.log('✅ tab update event listener registered');

      return () => {
        console.log('🧹 Cleaning up tab update event listener');
        socket.off('manager_tab_updated', handleTabUpdate);
      };
    } else {
      console.log('❌ No socket available for tabs');
    }
  }, [socket]);

  const fetchTabs = async () => {
    try {
      setLoading(true);
      let response;

      if (isManager) {
        // Managers see all tabs for their restaurants
        response = await axios.get('/restaurants/manager/tabs', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Customers see only their own tabs with detailed information
        const userTabsResponse = await axios.get('/tabs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // For each user tab, fetch the detailed information including items
        const detailedTabs = await Promise.all(
          userTabsResponse.data.tabs.map(async (tab) => {
            try {
              const tabDetailResponse = await axios.get(`/tabs/${tab.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                id: tab.id,
                user_id: tab.user_id,
                restaurant_id: tab.restaurant_id,
                payment_method_id: tab.payment_method_id,
                open_time: tab.open_time,
                close_time: tab.close_time,
                is_open: tab.is_open,
                total: tab.total,
                restaurant_name: tabDetailResponse.data.tab.restaurant_name,
                tab_items: tabDetailResponse.data.items
              };
            } catch (error) {
              console.error(`Error fetching details for tab ${tab.id}:`, error);
              return null;
            }
          })
        );

        // Filter out any failed fetches and group by restaurant for consistency
        const validTabs = detailedTabs.filter(tab => tab !== null);
        const groupedByRestaurant = validTabs.reduce((acc, tab) => {
          const restaurantId = tab.restaurant_id;
          if (!acc[restaurantId]) {
            acc[restaurantId] = {
              id: restaurantId,
              name: tab.restaurant_name,
              tabs: []
            };
          }
          acc[restaurantId].tabs.push(tab);
          return acc;
        }, {});

        response = { data: Object.values(groupedByRestaurant) };
      }

      setTabs(response.data);
    } catch (error) {
      console.error('Error fetching tabs:', error);
      setError('Failed to load tabs');
    } finally {
      setLoading(false);
    }
  };

  const toggleServedStatus = async (tabId, itemId, currentServed) => {
    if (!isManager) return; // Only managers can toggle served status

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
      <h1>{isManager ? 'Manager Tabs' : 'My Tabs'}</h1>

      {tabs.length === 0 ? (
        <p>{isManager ? 'No open tabs found.' : 'You have no tabs.'}</p>
      ) : (
        tabs.map(restaurant => (
          <div key={restaurant.id} className="restaurant-section">
            <h2>{restaurant.name}</h2>

            {restaurant.tabs.length === 0 ? (
              <p>{isManager ? 'No open tabs for this restaurant.' : 'No tabs for this restaurant.'}</p>
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
                          <span className="item-name">{item.menu_item?.name || item.name}</span>
                          <span className="item-quantity">Qty: {item.quantity}</span>
                          <span className="item-price">${(item.price || item.sub_price)?.toFixed(2)}</span>
                        </div>

                        {isManager && (
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
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="tab-total">
                    Total: ${tab.tab_items.reduce((sum, item) => sum + ((item.price || item.sub_price) * item.quantity), 0).toFixed(2)}
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

export default Tabs;