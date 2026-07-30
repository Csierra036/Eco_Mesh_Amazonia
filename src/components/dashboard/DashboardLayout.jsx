import { createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import HeaderDashboard from './HeaderDashboard.jsx';
import useSerialPort from '../../js/useSerialPort.js';
import { pushReading } from '../../js/sensorStore.js';

const SerialContext = createContext(null);

export function useSerial() {
  const ctx = useContext(SerialContext);
  if (!ctx) throw new Error('useSerial debe usarse dentro de DashboardLayout');
  return ctx;
}

export default function DashboardLayout() {
  const serial = useSerialPort({ onReading: pushReading });

  return (
    <SerialContext.Provider value={serial}>
      <div className="dashboard">
        <HeaderDashboard />
        <div className="dashboard__body">
          <Sidebar />
          <main className="dashboard__content">
            <Outlet />
          </main>
        </div>
      </div>
    </SerialContext.Provider>
  );
}
