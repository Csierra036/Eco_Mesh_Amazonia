import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import HeaderDashboard from './HeaderDashboard.jsx';

export default function DashboardLayout() {
  return (
    <div className="dashboard">
      <HeaderDashboard />
      <div className="dashboard__body">
        <Sidebar />
        <main className="dashboard__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
