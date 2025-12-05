import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payment-methods');
      setPaymentMethods(response.data.paymentMethods);
    } catch (error) {
      setError('Failed to load payment methods');
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    if (window.confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) {
      try {
        setLoading(true);
        await axios.delete(`/payment-methods/${paymentMethodId}`);
        // Refresh payment methods list
        await fetchPaymentMethods();
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to delete payment method');
        console.error('Error deleting payment method:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account and payment methods</p>
      </div>

      <div className="profile-content">
        <div className="user-info">
          <h2>User Information</h2>
          <div className="info-item">
            <label>Name:</label>
            <span>{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="payment-methods">
          <div className="section-header">
            <h2>Payment Methods</h2>
            <Link to="/add-payment-method" className="add-button">
              +
            </Link>
          </div>

          {error && <div className="error">{error}</div>}

          {paymentMethods.length === 0 ? (
            <p className="no-payment-methods">No payment methods saved</p>
          ) : (
            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className="payment-method-card">
                  <div className="payment-method-info">
                    <span className="card-brand">{method.card_brand}</span>
                    <span className="card-number">**** **** **** {method.card_number.slice(-4)}</span>
                    <span className="card-holder">{method.card_holder_name}</span>
                  </div>
                  <div className="payment-method-actions">
                    {method.is_default && (
                      <span className="default-badge">Default</span>
                    )}
                    <div className="action-buttons">
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="delete-button"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;