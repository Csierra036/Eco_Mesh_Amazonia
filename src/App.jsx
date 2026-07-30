import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Nodos from './pages/Nodos.jsx';
import Alertas from './pages/Alertas.jsx';
import Sensores from './pages/Sensores.jsx';
import Reportes from './pages/Reportes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="nodos" element={<Nodos />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="sensores" element={<Sensores />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
