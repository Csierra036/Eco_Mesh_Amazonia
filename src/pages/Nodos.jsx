import { useMemo } from 'react';
import SerialConnectButton from '../components/dashboard/SerialConnectButton.jsx';
import { useSerial } from '../components/dashboard/DashboardLayout.jsx';
import { useNodesStatus, ONLINE_THRESHOLD_MS } from '../js/sensorStore.js';

function formatNodo(node) {
  return node.charAt(0).toUpperCase() + node.slice(1);
}

function formatSince(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

export default function Nodos() {
  const serial = useSerial();
  const nodos = useNodesStatus();

  const { online, offline, ordenados } = useMemo(() => {
    const on = nodos.filter((n) => n.online);
    const off = nodos.filter((n) => !n.online);
    const sorted = [...on, ...off].sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return a.node.localeCompare(b.node);
    });
    return { online: on.length, offline: off.length, ordenados: sorted };
  }, [nodos]);

  const thresholdSec = Math.round(ONLINE_THRESHOLD_MS / 1000);

  return (
    <div className="nodos">
      <header className="nodos__header">
        <div>
          <h2 className="nodos__title">Nodos</h2>
          <p className="nodos__subtitle">
            Nodos comunicándose por el receptor ESP8266. Un nodo se considera online si
            envió lectura en los últimos {thresholdSec} s.
          </p>
        </div>
        <SerialConnectButton {...serial} />
      </header>

      <div className="nodos__summary">
        <div className="nodos__count nodos__count--online">
          <span className="nodos__count-dot" />
          <span className="nodos__count-value">{online}</span>
          <span className="nodos__count-label">Online</span>
        </div>
        <div className="nodos__count nodos__count--offline">
          <span className="nodos__count-dot" />
          <span className="nodos__count-value">{offline}</span>
          <span className="nodos__count-label">Offline</span>
        </div>
        <div className="nodos__count nodos__count--total">
          <span className="nodos__count-value">{nodos.length}</span>
          <span className="nodos__count-label">Total (sesión)</span>
        </div>
      </div>

      {ordenados.length === 0 ? (
        <div className="nodos__empty">
          <p>No hay nodos comunicándose todavía.</p>
          <p className="nodos__empty-hint">
            Conecta el receptor ESP8266 desde el botón superior; los nodos aparecerán
            aquí en cuanto envíen su primera lectura.
          </p>
        </div>
      ) : (
        <div className="nodos__grid">
          {ordenados.map((n) => (
            <article
              key={n.node}
              className={`node-card node-card--${n.online ? 'online' : 'offline'}`}
            >
              <header className="node-card__header">
                <span className="node-card__status-dot" />
                <h3 className="node-card__name">{formatNodo(n.node)}</h3>
                <span className="node-card__status-label">
                  {n.online ? 'Online' : 'Offline'}
                </span>
              </header>
              <dl className="node-card__readings">
                <div>
                  <dt>Temp</dt>
                  <dd>{n.last.temp.toFixed(1)} °C</dd>
                </div>
                <div>
                  <dt>Humedad</dt>
                  <dd>{n.last.hum.toFixed(1)} %</dd>
                </div>
              </dl>
              <footer className="node-card__footer">
                Última lectura {formatSince(n.msSinceLast)}
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
