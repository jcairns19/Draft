import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddPaymentMethod.css';

const AddPaymentMethod = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    card_number: '',
    card_cvc: '',
    card_holder_name: '',
    card_brand: '',
    card_exp_month: '',
    card_exp_year: '',
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'US',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Combine billing address fields into JSON
    const billingAddress = {
      line1: formData.billing_address_line1,
      line2: formData.billing_address_line2 || null,
      city: formData.billing_city,
      state: formData.billing_state,
      zip: formData.billing_zip,
      country: formData.billing_country
    };

    const submitData = {
      ...formData,
      billing_address: JSON.stringify(billingAddress)
    };

    try {
      await axios.post('/payment-methods', submitData);
      navigate('/profile');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add payment method');
      console.error('Error adding payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  return (
    <div className="add-payment-method">
      <div className="form-container">
        <div className="form-header">
          <h1>Add Payment Method</h1>
          <p>Enter your payment information securely</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="card_holder_name">Cardholder Name</label>
            <input
              type="text"
              id="card_holder_name"
              name="card_holder_name"
              value={formData.card_holder_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="card_number">Card Number</label>
            <input
              type="text"
              id="card_number"
              name="card_number"
              value={formData.card_number}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="card_exp_month">Expiration Month</label>
              <select
                id="card_exp_month"
                name="card_exp_month"
                value={formData.card_exp_month}
                onChange={handleChange}
                required
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month.toString().padStart(2, '0')}>
                    {month.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="card_exp_year">Expiration Year</label>
              <select
                id="card_exp_year"
                name="card_exp_year"
                value={formData.card_exp_year}
                onChange={handleChange}
                required
              >
                <option value="">Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="card_cvc">CVC</label>
              <input
                type="text"
                id="card_cvc"
                name="card_cvc"
                value={formData.card_cvc}
                onChange={handleChange}
                placeholder="123"
                maxLength="4"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="card_brand">Card Brand</label>
            <select
              id="card_brand"
              name="card_brand"
              value={formData.card_brand}
              onChange={handleChange}
            >
              <option value="">Select card brand (optional)</option>
              <option value="Visa">Visa</option>
              <option value="MasterCard">MasterCard</option>
              <option value="American Express">American Express</option>
              <option value="Discover">Discover</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="billing_address_line1">Billing Address Line 1</label>
            <input
              type="text"
              id="billing_address_line1"
              name="billing_address_line1"
              value={formData.billing_address_line1}
              onChange={handleChange}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="billing_address_line2">Billing Address Line 2</label>
            <input
              type="text"
              id="billing_address_line2"
              name="billing_address_line2"
              value={formData.billing_address_line2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billing_city">City</label>
              <input
                type="text"
                id="billing_city"
                name="billing_city"
                value={formData.billing_city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billing_state">State</label>
              <input
                type="text"
                id="billing_state"
                name="billing_state"
                value={formData.billing_state}
                onChange={handleChange}
                placeholder="State"
                maxLength="2"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billing_zip">ZIP Code</label>
              <input
                type="text"
                id="billing_zip"
                name="billing_zip"
                value={formData.billing_zip}
                onChange={handleChange}
                placeholder="12345"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="billing_country">Country</label>
            <select
              id="billing_country"
              name="billing_country"
              value={formData.billing_country}
              onChange={handleChange}
              required
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="MX">Mexico</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Set as default payment method
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Adding...' : 'Add Payment Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentMethod;