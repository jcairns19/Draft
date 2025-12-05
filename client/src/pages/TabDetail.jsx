import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import './TabDetail.css';

const TabDetail = () => {
  const { tab_id } = useParams();
  const navigate = useNavigate();
  const { socket, joinTabUpdates, leaveTabUpdates } = useSocket();
  const [tab, setTab] = useState(null);
  const [tabItems, setTabItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    fetchTabData();
    fetchPaymentMethods();

    // Join tab updates for real-time notifications
    if (tab_id) {
      joinTabUpdates(parseInt(tab_id));
    }

    return () => {
      if (tab_id) {
        leaveTabUpdates(parseInt(tab_id));
      }
    };
  }, [tab_id]);

  useEffect(() => {
    // Listen for item served updates
    if (socket) {
      console.log('Setting up socket listeners for tab', tab_id);

      const handleItemServed = async (data) => {
        console.log('🍽️ ITEM SERVED RECEIVED:', data);
        if (parseInt(data.tabId) === parseInt(tab_id)) {
          console.log('✅ Item served is for current tab, refreshing data...');
          // Fetch the latest tab data instead of just updating local state
          try {
            const response = await axios.get(`/tabs/${tab_id}`);
            console.log('✅ Tab data refreshed after item served:', response.data);
            setTab(response.data.tab);
            setTabItems(response.data.items || []);
          } catch (error) {
            console.error('❌ Error fetching updated tab data:', error);
          }
        } else {
          console.log('ℹ️ Item served update is for different tab, ignoring');
        }
      };

      const handleTabUpdated = async (data) => {
        console.log('📱 TAB UPDATED RECEIVED:', data);
        if (parseInt(data.tabId) === parseInt(tab_id)) {
          console.log('🔄 Tab update is for current tab, refreshing data...');
          // Fetch the latest tab data
          try {
            const response = await axios.get(`/tabs/${tab_id}`);
            console.log('✅ Tab data refreshed after tab update:', response.data);
            setTab(response.data.tab);
            setTabItems(response.data.items || []);
          } catch (error) {
            console.error('❌ Error fetching updated tab data:', error);
          }
        } else {
          console.log('ℹ️ Tab update is for different tab, ignoring');
        }
      };

      socket.on('item_served', handleItemServed);
      socket.on('tab_updated', handleTabUpdated);

      return () => {
        console.log('🧹 Cleaning up socket listeners for tab', tab_id);
        socket.off('item_served', handleItemServed);
        socket.off('tab_updated', handleTabUpdated);
      };
    } else {
      console.log('❌ No socket available for tab', tab_id);
    }
  }, [socket, tab_id]);

  const fetchTabData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/tabs/${tab_id}`);
      setTab(response.data.tab);
      setTabItems(response.data.items || []);
    } catch (error) {
      setError('Failed to load tab data');
      console.error('Error fetching tab data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payment-methods');
      setPaymentMethods(response.data.paymentMethods || []);
      // Set default payment method if available
      const defaultMethod = response.data.paymentMethods?.find(pm => pm.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const addItemToTab = async (menuItemId) => {
    try {
      await axios.post(`/tabs/${tab_id}/items`, { menu_item_id: menuItemId });
      // Refresh tab data to show updated items
      await fetchTabData();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add item to tab');
      console.error('Error adding item to tab:', error);
    }
  };

  const closeTab = async () => {
    if (!selectedPaymentMethodId) {
      setError('Please select a payment method');
      return;
    }

    try {
      const response = await axios.put(`/tabs/${tab_id}/close`, {
        payment_method_id: selectedPaymentMethodId
      });
      
      // Store payment details for confirmation display
      const closedTab = response.data.tab;
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
      
      setPaymentDetails({
        tab: closedTab,
        paymentMethod: selectedPaymentMethod,
        items: tabItems,
        paymentTime: new Date(closedTab.close_time)
      });
      setPaymentConfirmed(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to close tab');
      console.error('Error closing tab:', error);
    }
  };

  const toggleServedStatus = async (tabItemId, served) => {
    try {
      await axios.put(`/tabs/${tabItemId}/served`, { served });
      // Refresh tab data to show updated status
      fetchTabData();
    } catch (error) {
      setError('Failed to update item status');
      console.error('Error updating served status:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading tab...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!tab) {
    return <div className="error">Tab not found</div>;
  }

  // Show payment confirmation screen if tab has been paid
  if (paymentConfirmed && paymentDetails) {
    return (
      <div className="payment-confirmation">
        <div className="confirmation-header">
          <h1>✅ Payment Successful!</h1>
          <p>Your tab has been closed and payment processed.</p>
        </div>

        <div className="confirmation-details">
          <div className="order-summary">
            <h2>Order Details</h2>
            <div className="restaurant-info">
              <h3>{paymentDetails.tab.restaurant_name}</h3>
              <p>Tab #{paymentDetails.tab.id}</p>
            </div>
            
            <div className="order-items">
              {paymentDetails.items.map((item) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="payment-summary">
            <h2>Payment Information</h2>
            <div className="payment-details">
              <div className="detail-row">
                <span>Total Amount:</span>
                <span className="amount">${Number(paymentDetails.tab.total || 0).toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span>Payment Time:</span>
                <span>{paymentDetails.paymentTime.toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span>Payment Method:</span>
                <span>
                  {paymentDetails.paymentMethod?.card_brand || 'Card'} **** **** **** {paymentDetails.paymentMethod?.card_number?.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="action-button primary"
          >
            Return to Dashboard
          </button>
          <button 
            onClick={() => navigate('/tabs')} 
            className="action-button secondary"
          >
            View My Tabs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-detail">
      <div className="tab-header">
        <h1>Your Tab</h1>
        <div className="tab-info">
          <p>Restaurant: {tab.restaurant_name}</p>
          <p>Opened: {new Date(tab.open_time).toLocaleString()}</p>
          <p>Total: ${(parseFloat(tab.total) || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="tab-items">
        <h2>Items</h2>
        {tabItems.length === 0 ? (
          <p className="no-items">No items in this tab yet. Add some from the menu!</p>
        ) : (
          <div className="items-list">
            {tabItems.map((item) => (
              <div key={item.id} className={`tab-item ${item.served ? 'served' : 'pending'}`}>
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: ${Number(item.price || 0).toFixed(2)}</p>
                  <div className="item-status">
                    <span className={`status-badge ${item.served ? 'served' : 'pending'}`}>
                      {item.served ? 'Served' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="item-total">
                  ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                </div>
                {!tab.is_open && (
                  <button 
                    onClick={() => toggleServedStatus(item.id, !item.served)}
                    className={`serve-btn ${item.served ? 'unserve' : 'serve'}`}
                    disabled={true}
                    title="Only restaurant managers can update served status"
                  >
                    {item.served ? 'Mark as Pending' : 'Mark as Served'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {tab.is_open && (
        <div className="payment-method-selection">
          <h3>Select Payment Method</h3>
          {paymentMethods.length === 0 ? (
            <div className="no-payment-methods">
              <p>You don't have any payment methods set up.</p>
              <button 
                onClick={() => navigate('/profile')} 
                className="action-button primary"
              >
                Add Payment Method
              </button>
            </div>
          ) : (
            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <label key={method.id} className="payment-method-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethodId === method.id}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                  />
                  <div className="payment-method-info">
                    <span className="card-brand">{method.card_brand || 'Card'}</span>
                    <span className="card-number">**** **** **** {method.card_number?.slice(-4)}</span>
                    <span className="card-expiry">{method.card_exp_month}/{method.card_exp_year}</span>
                    {method.is_default && <span className="default-badge">Default</span>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tab-actions">
        <button onClick={() => navigate(-1)} className="action-button secondary">
          Back to Restaurant
        </button>
        {tab.is_open && (
          <button 
            onClick={closeTab} 
            className="action-button primary"
            disabled={!selectedPaymentMethodId}
          >
            Close Tab & Pay
          </button>
        )}
      </div>
    </div>
  );
};

export default TabDetail;