export const alarmasActivas = 3;
export const nodosOnline = 12;
export const nodosOffline = 2;
export const sensoresActivos = 36;

export const ultimasAlarmas = [
  { id: 1, tipo: 'Incendio', nodo: 'Centinela-07', fecha: '2026-07-23 14:32', estado: 'Activa' },
  { id: 2, tipo: 'Inundación', nodo: 'Río-03', fecha: '2026-07-23 13:15', estado: 'Activa' },
  { id: 3, tipo: 'Contaminación', nodo: 'Río-05', fecha: '2026-07-23 12:48', estado: 'Activa' },
];

export const lecturasRecientes = [
  { nodo: 'Centinela-01', tipo: 'Selva', temp: 28.5, humedad: 82, humo: 120, estado: 'Normal' },
  { nodo: 'Río-01', tipo: 'Río', ph: 7.2, turbidez: 15, nivel: 1.2, estado: 'Normal' },
  { nodo: 'Centinela-07', tipo: 'Selva', temp: 45.2, humedad: 30, humo: 850, estado: 'Alerta' },
  { nodo: 'Río-03', tipo: 'Río', ph: 5.8, turbidez: 85, nivel: 2.8, estado: 'Alerta' },
  { nodo: 'Centinela-03', tipo: 'Selva', temp: 27.1, humedad: 88, humo: 95, estado: 'Normal' },
  { nodo: 'Río-02', tipo: 'Río', ph: 7.0, turbidez: 12, nivel: 1.1, estado: 'Normal' },
];

export const alarmasPorHora = [
  { hora: '00:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '02:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '04:00', incendios: 1, inundaciones: 0, contaminacion: 0 },
  { hora: '06:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '08:00', incendios: 0, inundaciones: 1, contaminacion: 0 },
  { hora: '10:00', incendios: 1, inundaciones: 0, contaminacion: 0 },
  { hora: '12:00', incendios: 2, inundaciones: 0, contaminacion: 1 },
  { hora: '14:00', incendios: 1, inundaciones: 1, contaminacion: 0 },
  { hora: '16:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '18:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '20:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
  { hora: '22:00', incendios: 0, inundaciones: 0, contaminacion: 0 },
];
