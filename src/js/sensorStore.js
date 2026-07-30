import { useMemo, useSyncExternalStore } from 'react';

// Store en memoria de las lecturas que llegan por Serial.
// Sin persistencia: al recargar la página se pierde todo.

const MAX_READINGS = 50;
const EMPTY_READINGS = [];

let state = {
  byNode: {},   // { [node]: { readings: [...máx 50], last, updatedAt } }
  nodeIds: [],  // referencia estable mientras no aparezca un nodo nuevo
  lastUpdate: 0,
};

const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getState() {
  return state;
}

/**
 * Normaliza una línea JSON del ESP8266: {"node":"selva-01","t":28.4,"h":61.2,"ts":12345}
 * Devuelve null si la lectura no es usable.
 */
function normalize(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const node = typeof raw.node === 'string' && raw.node.trim() ? raw.node.trim() : null;
  const temp = Number(raw.t);
  const hum = Number(raw.h);
  if (!node || !Number.isFinite(temp) || !Number.isFinite(hum)) return null;

  return {
    node,
    temp,
    hum,
    ts: Number.isFinite(Number(raw.ts)) ? Number(raw.ts) : null, // millis() del ESP
    receivedAt: Date.now(),
  };
}

export function pushReading(raw) {
  const reading = normalize(raw);
  if (!reading) return false;

  const prev = state.byNode[reading.node];
  const readings = prev ? [...prev.readings, reading].slice(-MAX_READINGS) : [reading];

  state = {
    byNode: {
      ...state.byNode,
      [reading.node]: { readings, last: reading, updatedAt: reading.receivedAt },
    },
    nodeIds: prev ? state.nodeIds : [...state.nodeIds, reading.node],
    lastUpdate: reading.receivedAt,
  };

  listeners.forEach((listener) => listener());
  return true;
}

export function clearReadings() {
  state = { byNode: {}, nodeIds: [], lastUpdate: 0 };
  listeners.forEach((listener) => listener());
}

/** Última lectura de un nodo, o null. */
export function useLastReading(node) {
  return useSyncExternalStore(
    subscribe,
    () => getState().byNode[node]?.last ?? null,
  );
}

/** Las n lecturas más recientes de un nodo (todas si se omite n). */
export function useRecentReadings(node, n) {
  const readings = useSyncExternalStore(
    subscribe,
    () => getState().byNode[node]?.readings ?? EMPTY_READINGS,
  );

  return useMemo(
    () => (n && n < readings.length ? readings.slice(-n) : readings),
    [readings, n],
  );
}

/** Ids de todos los nodos vistos en esta sesión. */
export function useAllNodes() {
  return useSyncExternalStore(subscribe, () => getState().nodeIds);
}

/** Última lectura de cada nodo, ordenada por nodo. */
export function useLatestByNode() {
  const nodeIds = useAllNodes();
  const byNode = useSyncExternalStore(subscribe, () => getState().byNode);

  return useMemo(
    () => nodeIds.map((node) => byNode[node].last),
    [nodeIds, byNode],
  );
}

/** Timestamp (Date.now) de la última lectura recibida de cualquier nodo. 0 si no hay. */
export function useLastUpdate() {
  return useSyncExternalStore(subscribe, () => getState().lastUpdate);
}

export default {
  pushReading,
  clearReadings,
  useLastReading,
  useRecentReadings,
  useAllNodes,
  useLatestByNode,
  useLastUpdate,
};
