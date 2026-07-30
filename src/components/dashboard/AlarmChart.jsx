import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { alarmasPorHora } from '../../data/mockData.js';

export default function AlarmChart() {
  return (
    <div className="alarm-chart">
      <h3 className="alarm-chart__title">Alarmas en las últimas 24 horas</h3>
      <div className="alarm-chart__container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={alarmasPorHora} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="hora" tick={{ fill: '#666666', fontSize: 12 }} />
            <YAxis tick={{ fill: '#666666', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="incendios" name="Incendios" fill="#DC2626" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inundaciones" name="Inundaciones" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="contaminacion" name="Contaminación" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
