import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import TabDetail from './pages/TabDetail';
import AddPaymentMethod from './pages/AddPaymentMethod';
import Profile from './pages/Profile';
import Tabs from './pages/Tabs';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />
              <Route path="/tabs/:tab_id" element={<TabDetail />} />
              <Route path="/add-payment-method" element={<AddPaymentMethod />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/tabs" element={<Tabs />} />
            </Routes>
          </main>
        </div>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
