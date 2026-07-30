import StatCard from '../components/dashboard/StatCard.jsx';
import AlarmChart from '../components/dashboard/AlarmChart.jsx';
import SensorTable from '../components/dashboard/SensorTable.jsx';
import SerialConnectButton from '../components/dashboard/SerialConnectButton.jsx';
import { useSerial } from '../components/dashboard/DashboardLayout.jsx';
// Los StatCard y AlarmChart siguen con mock; las lecturas de sensores vienen del ESP8266.
import { alarmasActivas, nodosOnline, nodosOffline, sensoresActivos } from '../data/mockData.js';

export default function Dashboard() {
  const serial = useSerial();

  return (
    <div className="dashboard-main">
      <div className="dashboard-main__serial">
        <SerialConnectButton {...serial} />
      </div>

      <div className="dashboard-main__stats">
        <StatCard
          title="Alarmas Activas"
          value={alarmasActivas}
          color="danger"
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          trend={{ type: 'up', value: '+2 hoy' }}
        />
        <StatCard
          title="Nodos Online"
          value={nodosOnline}
          color="success"
          icon="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
        />
        <StatCard
          title="Nodos Offline"
          value={nodosOffline}
          color="dark"
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        />
        <StatCard
          title="Sensores Activos"
          value={sensoresActivos}
          color="primary"
          icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </div>

      <div className="dashboard-main__charts">
        <AlarmChart />
      </div>

      <div className="dashboard-main__table">
        <SensorTable />
      </div>
    </div>
  );
}
