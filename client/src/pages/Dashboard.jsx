import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome {user?.first_name}!</h1>
        <p>This is your personal dashboard. Here you can manage your restaurant preferences and view your activity.</p>
      </div>
    </div>
  );
};

export default Dashboard;