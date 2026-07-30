import { useLatestByNode } from '../../js/sensorStore.js';

// Umbral de alerta por temperatura para los nodos de selva
const TEMP_ALERTA = 40;

function formatNodo(node) {
  return node.charAt(0).toUpperCase() + node.slice(1);
}

export default function SensorTable() {
  const lecturas = useLatestByNode();

  return (
    <div className="sensor-table">
      <h3 className="sensor-table__title">Últimas lecturas de sensores</h3>
      <div className="sensor-table__container">
        <table className="sensor-table__table">
          <thead>
            <tr>
              <th>Nodo</th>
              <th>Tipo</th>
              <th>Lectura</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lecturas.length === 0 ? (
              <tr className="sensor-table__row">
                <td className="sensor-table__empty" colSpan={4}>
                  Esperando datos del ESP8266...
                </td>
              </tr>
            ) : (
              lecturas.map((lectura) => {
                const estado = lectura.temp >= TEMP_ALERTA ? 'Alerta' : 'Normal';

                return (
                  <tr
                    key={lectura.node}
                    className={`sensor-table__row sensor-table__row--${estado.toLowerCase()}`}
                  >
                    <td className="sensor-table__nodo">{formatNodo(lectura.node)}</td>
                    <td className="sensor-table__tipo">
                      <span className="sensor-table__badge sensor-table__badge--selva">Selva</span>
                    </td>
                    <td className="sensor-table__lectura">
                      <span>{lectura.temp.toFixed(1)}°C</span>
                      <span className="sensor-table__separator">·</span>
                      <span>{lectura.hum.toFixed(1)}% hum</span>
                    </td>
                    <td className="sensor-table__estado">
                      <span
                        className={`sensor-table__status sensor-table__status--${estado.toLowerCase()}`}
                      >
                        {estado}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
