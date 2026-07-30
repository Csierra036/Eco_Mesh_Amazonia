import { useEffect, useState } from 'react';
import { useLastUpdate } from '../../js/sensorStore.js';

// Sin lecturas durante este tiempo => el flujo se considera estancado
const STALE_MS = 10000;

const LABELS = {
  idle: 'Conectar ESP8266',
  requesting: 'Selecciona el puerto...',
  waiting: 'Conectado · esperando datos',
  live: 'Recibiendo datos',
  stale: 'Sin datos',
};

export default function SerialConnectButton({
  connect,
  disconnect,
  isConnected,
  isConnecting,
  error,
  supported,
}) {
  const lastUpdate = useLastUpdate();
  const [now, setNow] = useState(() => Date.now());
  const [connectedAt, setConnectedAt] = useState(0);

  // Reloj de 1 s solo mientras hay conexión, para detectar el estancamiento
  useEffect(() => {
    if (!isConnected) {
      setConnectedAt(0);
      return undefined;
    }
    setConnectedAt(Date.now());
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isConnected]);

  if (!supported) {
    return (
      <div className="serial-connect">
        <p className="serial-connect__unsupported">
          Este navegador no soporta Web Serial. Abre el dashboard en Chrome o Edge sobre
          <code> localhost</code> para conectar el ESP8266.
        </p>
      </div>
    );
  }

  const hasData = lastUpdate > 0 && lastUpdate >= connectedAt;
  const secondsSinceData = hasData ? Math.floor((now - lastUpdate) / 1000) : null;

  let state = 'idle';
  if (isConnecting) state = 'requesting';
  else if (isConnected && !hasData) state = 'waiting';
  else if (isConnected) state = now - lastUpdate > STALE_MS ? 'stale' : 'live';

  let label = LABELS[state];
  if (state === 'live' || state === 'stale') label = `${label} · hace ${secondsSinceData}s`;

  return (
    <div className="serial-connect">
      <button
        type="button"
        className={`serial-connect__btn serial-connect__btn--${state}`}
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
      >
        <span className="serial-connect__dot" />
        {label}
      </button>
      {isConnected && (
        <span className="serial-connect__hint">Click para desconectar</span>
      )}
      {error && <p className="serial-connect__error">{error}</p>}
    </div>
  );
}
