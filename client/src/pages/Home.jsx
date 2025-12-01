import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Draft</h1>
        <p>Discover great restaurants and manage your dining experience</p>

        {isAuthenticated ? (
          <Link to="/restaurants" className="cta-button">
            Browse Restaurants
          </Link>
        ) : (
          <div className="auth-buttons">
            <Link to="/signup" className="cta-button primary">
              Get Started
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div className="features">
        <div className="feature">
          <h3>🍽️ Discover Restaurants</h3>
          <p>Find your favorite local restaurants and explore their menus</p>
        </div>
        <div className="feature">
          <h3>💳 Easy Payments</h3>
          <p>Save payment methods and settle tabs with one click</p>
        </div>
        <div className="feature">
          <h3>💬 Connect with Others</h3>
          <p>Chat with fellow diners at your favorite restaurants</p>
        </div>
      </div>
    </div>
  );
};

export default Home;