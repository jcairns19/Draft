import { useState, useEffect } from 'react';
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
          <h2>Payment Methods</h2>

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
                  {method.is_default && (
                    <span className="default-badge">Default</span>
                  )}
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