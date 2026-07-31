import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useNodesStatus,
  useRecentReadings,
} from '../js/sensorStore.js';

function formatNodo(node) {
  return node.charAt(0).toUpperCase() + node.slice(1);
}

function formatTime(ts) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  fontSize: '0.75rem',
};

// El hook se llama aquí (no en el padre) para que solo se suscriba a las
// lecturas del nodo cuya fila está abierta.
function SensorHistory({ node }) {
  const readings = useRecentReadings(node);

  const data = useMemo(
    () => readings.map((r) => ({ t: r.receivedAt, temp: r.temp, hum: r.hum })),
    [readings],
  );

  if (data.length === 0) {
    return (
      <div className="sensor-row__panel">
        <p className="sensor-row__empty">Aún no hay lecturas para este sensor.</p>
      </div>
    );
  }

  return (
    <div className="sensor-row__panel">
      <div className="sensor-row__charts">
        <div className="sensor-row__chart">
          <h4 className="sensor-row__chart-title">Temperatura</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="t"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickFormatter={formatTime}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: '#666666', fontSize: 11 }}
                unit="°C"
                domain={['auto', 'auto']}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={formatTime}
                formatter={(value) => [`${value.toFixed(1)} °C`, 'Temp']}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#DC2626"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="sensor-row__chart">
          <h4 className="sensor-row__chart-title">Humedad</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="t"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickFormatter={formatTime}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: '#666666', fontSize: 11 }}
                unit="%"
                domain={['auto', 'auto']}
                width={48}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={formatTime}
                formatter={(value) => [`${value.toFixed(1)} %`, 'Hum']}
              />
              <Line
                type="monotone"
                dataKey="hum"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sensor-row__meta">
        <span>{data.length} lecturas en memoria (máx. 50)</span>
        <span>Última: {formatTime(data[data.length - 1].t)}</span>
      </div>
    </div>
  );
}

export default function Sensores() {
  const nodos = useNodesStatus();
  const [expanded, setExpanded] = useState(() => new Set());

  const toggle = (node) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  const ordenados = useMemo(
    () =>
      [...nodos].sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return a.node.localeCompare(b.node);
      }),
    [nodos],
  );

  return (
    <div className="sensores">
      <header className="sensores__header">
        <h2 className="sensores__title">Sensores</h2>
        <p className="sensores__subtitle">
          Un elemento por dispositivo. Haz clic en cualquier fila para desplegar el
          historial en vivo de sus lecturas.
        </p>
      </header>

      {ordenados.length === 0 ? (
        <div className="sensores__empty">
          <p>Aún no llegan lecturas.</p>
          <p className="sensores__empty-hint">
            Conecta el receptor ESP8266 desde el Dashboard; los sensores aparecerán
            aquí en cuanto envíen su primera trama.
          </p>
        </div>
      ) : (
        <ul className="sensor-list">
          {ordenados.map((n) => {
            const isOpen = expanded.has(n.node);
            return (
              <li
                key={n.node}
                className={`sensor-row sensor-row--${n.online ? 'online' : 'offline'} ${
                  isOpen ? 'sensor-row--open' : ''
                }`}
              >
                <button
                  type="button"
                  className="sensor-row__toggle"
                  onClick={() => toggle(n.node)}
                  aria-expanded={isOpen}
                >
                  <span className="sensor-row__status-dot" aria-hidden="true" />
                  <span className="sensor-row__name">{formatNodo(n.node)}</span>
                  <span className="sensor-row__readings">
                    <span className="sensor-row__metric">
                      <span className="sensor-row__metric-label">Temp</span>
                      <span className="sensor-row__metric-value">
                        {n.last.temp.toFixed(1)} °C
                      </span>
                    </span>
                    <span className="sensor-row__metric">
                      <span className="sensor-row__metric-label">Hum</span>
                      <span className="sensor-row__metric-value">
                        {n.last.hum.toFixed(1)} %
                      </span>
                    </span>
                  </span>
                  <span className="sensor-row__status-label">
                    {n.online ? 'Online' : 'Offline'}
                  </span>
                  <svg
                    className="sensor-row__chevron"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isOpen && <SensorHistory node={n.node} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
