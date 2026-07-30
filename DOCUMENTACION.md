# Documentación Completa de EcoMesh

> **EcoMesh Amazonia** — Sistema Unificado de Monitoreo Ambiental Comunitario para la Amazonia.
> Frontend: React 18 + Vite | Firmware: ESP32-S (emisor) + ESP8266 (receptor)

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Flujo de Datos](#2-flujo-de-datos)
3. [Firmware — ESP32-S Emisor](#3-firmware--esp32-s-emisor)
4. [Firmware — ESP8266 Receptor](#4-firmware--esp8266-receptor)
5. [Frontend React](#5-frontend-react)
   - [Estructura de Archivos](#51-estructura-de-archivos)
   - [Punto de Entrada](#52-punto-de-entrada-mainjsx)
   - [App y Router](#53-app-y-router-appjsx)
   - [Landing Page](#54-landing-page)
   - [Dashboard](#55-dashboard)
   - [Sensor Store](#56-sensor-store-sensorstorejs)
   - [Web Serial Hook](#57-web-serial-hook-useserialportjs)
   - [Componentes del Dashboard](#58-componentes-del-dashboard)
   - [Componentes Generales](#59-componentes-generales)
6. [Estilos CSS](#6-estilos-css)
7. [Datos Mock](#7-datos-mock)
8. [Configuración del Proyecto](#8-configuración-del-proyecto)
9. [Consideraciones Técnicas](#9-consideraciones-técnicas)

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                   AMAZONIA (campo)                          │
│  ┌──────────────────┐        ┌───────────────────────┐      │
│  │   ESP32-S (D1)   │        │    ESP32-S (D2)      │      │
│  │   Sensor HTU21D  │        │    Sensor HTU21D      │      │
│  │   (temp+hum)     │        │    (temp+hum)         │      │
│  └────────┬─────────┘        └──────────┬────────────┘      │
│           │ ESP-NOW (canal 1)           │ ESP-NOW           │
│           └──────────────┬──────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│              ┌──────────────────────┐                       │
│              │    ESP8266 Receptor  │                       │
│              │  (escucha ESP-NOW)   │                       │
│              └──────────┬───────────┘                       │
│                         │ USB-Serial (CP210x/CH340/FTDI)    │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │    Navegador (Chrome/Edge)   │
           │     Web Serial API (localhost)│
           │        115200 baud            │
           └──────────────┬───────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   useSerialPort.js  │
              │  (hook React)       │
              └──────────┬──────────┘
                         │ pushReading()
                         ▼
              ┌─────────────────────┐
              │   sensorStore.js    │
              │  (en memoria)       │
              │  máx 50 lecturas    │
              │  por nodo           │
              └──────────┬──────────┘
                         │ hooks React
                         ▼
              ┌─────────────────────┐
              │     Dashboard       │
              │  SensorTable.jsx    │
              │  StatCard.jsx       │
              │  AlarmChart.jsx     │
              │  SerialConnectBtn   │
              └─────────────────────┘
```

### Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 18, Vite 5, React Router 7 |
| Gráficos | Recharts 3 |
| Animaciones | GSAP 3 + Flip |
| Emisor | ESP32-S (ESP-NOW, WiFi) |
| Sensor | HTU21D-F (temperatura, humedad) vía I2C |
| Receptor | ESP8266 (ESP-NOW, Serial USB) |
| Protocolo campo | ESP-NOW (canal 1) |
| Protocolo PC | Web Serial API (USB, 115200 baud) |
| Persistencia | Solo en memoria RAM del navegador |

---

## 2. Flujo de Datos

### 2.1 Cadena Completa

```
HTU21D-F (I2C)
     │
     ▼
ESP32-S lee temp + hum cada 3s
     │
     ▼ (ESP-NOW, canal 1, paquete binario de 8 bytes)
ESP8266 recibe vía OnDataRecv callback
     │
     ▼ (Serial USB, 115200 baud, línea JSON)
    {"node":"selva-01","t":28.40,"h":61.20,"ts":54321}
     │
     ▼ (Web Serial API → ReadableStream → TextDecoderStream → LineBreakTransformer)
useSerialPort.js parsea la línea
     │
     ▼ pushReading(parsedObject)
sensorStore.js normaliza y almacena en byNode[node].readings[]
     │
     ▼ hooks useSyncExternalStore
SensorTable.jsx → useLatestByNode() → renderiza filas
SerialConnectButton.jsx → useLastUpdate() → estado del botón
```

### 2.2 Formato del JSON en Serial

El ESP8266 emite una línea JSON por cada lectura recibida:

```json
{"node":"selva-01","t":28.40,"h":61.20,"ts":54321}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `node` | string | Identificador del nodo (ej: `selva-01`) |
| `t` | float | Temperatura en °C |
| `h` | float | Humedad relativa en % |
| `ts` | int | `millis()` del ESP8266 al recibir |

Las líneas de depuración (que no empiezan con `{`) son ignoradas por el frontend.

---

## 3. Firmware — ESP32-S Emisor

**Archivo:** `src/ESP/sketch_jul28a/ESP32S.ino`

### 3.1 Propósito

Lee temperatura y humedad del sensor HTU21D-F vía I2C y las envía por ESP-NOW al ESP8266 receptor cada 3 segundos.

### 3.2 Conexiones del Sensor

| HTU21D-F | ESP32-S |
|---|---|
| VCC | 3.3V |
| GND | GND |
| SDA | GPIO21 |
| SCL | GPIO22 |

### 3.3 Funcionamiento

**`setup()`:**
1. Inicializa `Serial` para depuración
2. Inicializa I2C en pines 21 (SDA) y 22 (SCL)
3. Inicializa el sensor HTU21D-F
4. Configura WiFi en modo `WIFI_STA`
5. Fija el canal WiFi al **canal 1** con `esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE)` — esto es **crítico** para que el ESP8266 pueda recibir los paquetes
6. Inicializa ESP-NOW
7. Registra el callback `OnDataSent` (notifica si el envío fue exitoso o falló)
8. Agrega al ESP8266 como peer usando su dirección MAC (`C8:C9:A3:14:1B:10`)

**`loop()`:**
1. Lee temperatura y humedad del HTU21D-F
2. Si la lectura es válida, rellena la estructura `datosEnviar` con `{ temperatura, humedad }`
3. Envía por ESP-NOW: `esp_now_send(receptorMAC, &datosEnviar, sizeof(datosEnviar))`
4. Espera 3 segundos (`delay(3000)`)

### 3.4 Estructura de Datos

```c
typedef struct struct_message {
  float temperatura;
  float humedad;
} struct_message;
```

Ambos `float` ocupan 4 bytes cada uno → **8 bytes por paquete ESP-NOW**.

### 3.5 Dependencias

- `Adafruit_HTU21DF` — librería del sensor
- `esp_now.h` — protocolo ESP-NOW
- `esp_wifi.h` — control de canal WiFi
- `WiFi.h` — modo station

---

## 4. Firmware — ESP8266 Receptor

**Archivo:** `src/ESP/ESP8266/ESP8266.ino`

### 4.1 Propósito

Escucha pasivamente los paquetes ESP-NOW del ESP32-S emisor y reenvía las lecturas al PC por Serial USB en formato JSON.

### 4.2 Funcionamiento

**`setup()`:**
1. Inicializa `Serial` a 115200 baud
2. Configura WiFi en modo `WIFI_STA` y se desconecta (no necesita asociarse a ningún AP)
3. Fija el canal WiFi al **canal 1** con `wifi_set_channel(WIFI_CHANNEL)` — esto debe hacerse **antes** de `esp_now_init()` o no se recibirán paquetes
4. Inicializa ESP-NOW
5. Se define como `ESP_NOW_ROLE_SLAVE`
6. Registra el callback `OnDataRecv`

**`loop()`:**
- Vacío — el receptor opera por callbacks de interrupción

**`OnDataRecv(mac, incomingData, len)`:**
1. Valida que el tamaño del paquete coincida con `sizeof(datosRecibidos)` (8 bytes)
2. Copia los datos entrantes a `datosRecibidos` con `memcpy`
3. Serializa a JSON con `snprintf` (evita fragmentación de heap):
   ```c
   char json[96];
   snprintf(json, sizeof(json),
            "{\"node\":\"%s\",\"t\":%s,\"h\":%s,\"ts\":%lu}",
            NODE_ID, temp, hum, millis());
   Serial.println(json);
   ```
4. Imprime líneas de depuración adicionales (ignoradas por el frontend)

### 4.3 Detalles Técnicos Clave

| Parámetro | Valor |
|---|---|
| Identificador de nodo | `selva-01` |
| Canal WiFi | 1 |
| Baud rate Serial | 115200 |
| Tamaño del buffer JSON | 96 bytes |
| Formato de temperatura | `dtostrf(valor, 0, 2, buffer)` → 2 decimales |

### 4.4 Bug Conocido — Canal WiFi

> El receptor **debe** fijar `wifi_set_channel(WIFI_CHANNEL)` antes de `esp_now_init()`. Si no se fija el canal, el ESP8266 escuchará en el canal por defecto (canal 6 o el último usado) y nunca recibirá los paquetes del emisor que transmite en canal 1.

---

## 5. Frontend React

### 5.1 Estructura de Archivos

```
src/
├── main.jsx                          # Entry point
├── App.jsx                           # Router raíz
├── styles/
│   └── index.css                     # Estilos globales (~722 líneas)
├── data/
│   └── mockData.js                   # Datos de referencia/fallback
├── js/
│   ├── main.js                       # Lógica JS general (inicializa PrettyModal)
│   ├── PrettyModal.js                # Animación GSAP Flip para modales
│   ├── sensorStore.js                # Store en memoria de lecturas
│   └── useSerialPort.js              # Hook Web Serial API
├── pages/
│   ├── Landing.jsx                   # Landing pública
│   └── Dashboard.jsx                 # Dashboard principal
└── components/
    ├── Header.jsx                    # Header general
    ├── Hero.jsx                      # Hero del landing
    ├── LoginModal.jsx                # Modal de login
    ├── AccederButton.jsx             # Botón acceder
    └── dashboard/
        ├── DashboardLayout.jsx       # Layout del dashboard
        ├── HeaderDashboard.jsx       # Header del dashboard
        ├── Sidebar.jsx               # Sidebar navegación
        ├── SerialConnectButton.jsx   # Botón conexión Serial
        ├── SensorTable.jsx           # Tabla de sensores
        ├── StatCard.jsx              # Tarjetas de estadísticas
        └── AlarmChart.jsx            # Gráfico de alarmas
```

### 5.2 Punto de Entrada — `main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import './js/main.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- Renderiza `<App />` dentro de `React.StrictMode`
- Importa estilos globales y el script `main.js` (que inicializa `PrettyModal` globalmente)

### 5.3 App y Router — `App.jsx`

Define dos rutas principales con React Router:

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `<Landing />` | Página de aterrizaje pública |
| `/dashboard` | `<DashboardLayout />` | Layout protegido del dashboard |
| `/dashboard/` (index) | `<Dashboard />` | Contenido principal del dashboard |

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/dashboard" element={<DashboardLayout />}>
      <Route index element={<Dashboard />} />
    </Route>
  </Routes>
</BrowserRouter>
```

### 5.4 Landing Page

Compuesta por:
- **`Header.jsx`**: Logo "Eco Mesh" + `<AccederButton />` que abre el modal
- **`Hero.jsx`**: Título "Eco Mesh Amazonia" sobre imagen de fondo con clip-path
- **`LoginModal.jsx`**: `<dialog>` con formulario email/contraseña. Al enviar, navega a `/dashboard`
- **`AccederButton.jsx`**: Dispara `window.prettyModal.open('modal-login', e)` — usa GSAP Flip para animar la transición del botón al modal

**Flujo del modal con GSAP Flip:**
1. `open(dialogID, event)`: Captura el estado del botón (posición, tamaño) con `Flip.getState()`
2. Muestra el `<dialog>` con `showModal()`
3. Anima desde la posición del botón hacia el centro con `Flip.from(originState, { targets: dialog })`
4. Añade bounce elástico con `elastic.out(1, 0.55)`
5. `close(dialogID, event)`: Invierte la animación, volviendo el modal al botón

### 5.5 Dashboard

**Archivo:** `src/pages/Dashboard.jsx`

#### 5.5.1 Organización

```
┌─────────────────────────────────────────────────┐
│ HeaderDashboard  (Volver al inicio · Admin)     │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  dashboard-main                      │
│          │  ┌────────────────────────────────┐  │
│ Dashboard│  │ SerialConnectButton            │  │
│ Nodos    │  ├──────────┬──────────┬─────────┤  │
│ Alertas  │  │ StatCard │ StatCard │StatCard │  │
│ Sensores │  │ Alarmas  │ Online   │ Offline │  │
│ Reportes │  │ Activas  │          │         │  │
│          │  ├──────────┴──────────┴─────────┤  │
│          │  │ StatCard: Sensores Activos    │  │
│          │  ├───────────────────────────────┤  │
│          │  │ AlarmChart (recharts)         │  │
│          │  ├───────────────────────────────┤  │
│          │  │ SensorTable                   │  │
│          │  └───────────────────────────────┘  │
└──────────┴──────────────────────────────────────┘
```

#### 5.5.2 Conexión Serial

```jsx
const serial = useSerialPort({ onReading: pushReading });
```

- Llama al hook `useSerialPort` pasando `pushReading` como handler
- Cada línea JSON que llega del ESP8266 se almacena en el store
- Renderiza `<SerialConnectButton {...serial} />` con los estados del hook

#### 5.5.3 Tarjetas de Estadísticas (StatCard)

Toman datos de `mockData.js` por ahora (referencia/fallback):

| Tarjeta | Valor | Color |
|---|---|---|
| Alarmas Activas | `alarmasActivas` (3) | danger (rojo) |
| Nodos Online | `nodosOnline` (12) | success (verde) |
| Nodos Offline | `nodosOffline` (2) | dark (negro) |
| Sensores Activos | `sensoresActivos` (36) | primary (verde institucional) |

#### 5.5.4 Gráfico de Alarmas (AlarmChart)

- Usa **Recharts** (`BarChart`)
- Datos de `mockData.js` → `alarmasPorHora` (12 intervalos de 2h)
- 3 series: Incendios (rojo), Inundaciones (azul), Contaminación (amarillo)
- Contenedor responsivo con `ResponsiveContainer`

#### 5.5.5 Tabla de Sensores (SensorTable)

- Lee del `sensorStore` con `useLatestByNode()`
- Para cada nodo muestra: nombre, tipo ("Selva"), lectura (temp + hum), estado
- Umbral de alerta: `temp >= 40°C` → estado "Alerta"
- Mensaje vacío: *"Esperando datos del ESP8266..."*
- Sin datos mock — solo muestra lecturas reales del ESP

### 5.6 Sensor Store — `sensorStore.js`

**Patrón:** Store externa con `useSyncExternalStore` (sin librerías externas de estado).

#### 5.6.1 Estructura del Estado

```javascript
state = {
  byNode: {
    "selva-01": {
      readings: [
        { node: "selva-01", temp: 28.4, hum: 61.2, ts: 12345, receivedAt: 1721800000000 },
        // ... hasta 50 lecturas
      ],
      last: { node: "selva-01", temp: 28.4, hum: 61.2, ts: 12345, receivedAt: 1721800000000 },
      updatedAt: 1721800000000
    }
  },
  nodeIds: ["selva-01"],
  lastUpdate: 1721800000000
};
```

#### 5.6.2 API Pública

| Función/Hook | Descripción |
|---|---|
| `pushReading(raw)` | Normaliza y guarda una lectura. Retorna `true` si fue válida |
| `clearReadings()` | Limpia todo el estado |
| `useLastReading(node)` | Última lectura de un nodo específico |
| `useRecentReadings(node, n)` | Últimas `n` lecturas de un nodo |
| `useAllNodes()` | IDs de todos los nodos vistos |
| `useLatestByNode()` | Última lectura de cada nodo (array ordenado) |
| `useLastUpdate()` | Timestamp de la última lectura global |

#### 5.6.3 Normalización

```javascript
function normalize(raw) {
  // Valida: raw.node (string), raw.t (number), raw.h (number)
  // Retorna: { node, temp, hum, ts, receivedAt }
}
```

El formato esperado del ESP8266 es: `{"node":"selva-01","t":28.4,"h":61.2,"ts":12345}`

#### 5.6.4 Características

- **Máximo 50 lecturas** por nodo (las más antiguas se descartan)
- **Sin persistencia** — al recargar la página se pierde todo
- **Notificación por suscripción**: `listeners.forEach(l => l())` tras cada cambio
- **Referencias estables**: `nodeIds` no cambia si no aparecen nodos nuevos

### 5.7 Web Serial Hook — `useSerialPort.js`

#### 5.7.1 API Retornada

```javascript
{
  connect: async () => void,       // Solicita puerto y abre conexión
  disconnect: async () => void,    // Cierra puerto y libera recursos
  isConnected: boolean,            // Puerto abierto y streaming activo
  isConnecting: boolean,           // En proceso de apertura
  error: string | null,            // Mensaje de error o null
  supported: boolean               // navigator.serial disponible
}
```

#### 5.7.2 Filtros USB

Se aceptan tres familias de chips USB-serial:

| Fabricante | Vendor ID | Chips |
|---|---|---|
| Silicon Labs | `0x10C4` | CP2102, CP210x |
| QinHeng | `0x1A86` | CH340, CH9102 |
| FTDI | `0x0403` | FT232, FT231X |

#### 5.7.3 Pipeline de Lectura

```
navigator.serial.requestPort({ filters: USB_FILTERS })
  → port.open({ baudRate: 115200 })
    → port.readable.pipeTo(TextDecoderStream.writable)   // bytes → string
      → decoder.readable.pipeThrough(LineBreakTransformer) // string → líneas
        → reader.read()  // { value: línea, done: boolean }
```

**LineBreakTransformer**: Acumula chunks hasta encontrar `\n` o `\r\n`, luego emite líneas completas.

**Parsing**: Solo las líneas que empiezan con `{` se consideran JSON y se parsean con `JSON.parse`. El resto (depuración del ESP) se ignora a menos que se pase `onLine`.

#### 5.7.4 Manejo de Desconexión Física

- Se registra un listener en `navigator.serial.addEventListener('disconnect', ...)`
- Al detectar desconexión del USB, se limpia el estado y se muestra el error: *"El ESP8266 se desconectó del USB."*
- Al desmontar el componente, se ejecuta `teardown()` que cierra reader, pipe y puerto

### 5.8 Componentes del Dashboard

#### 5.8.1 SerialConnectButton — `SerialConnectButton.jsx`

Botón con **5 estados visuales**:

| Estado | Condición | Label | Estilo | Dot |
|---|---|---|---|---|
| `idle` | No conectado | "Conectar ESP8266" | Blanco por defecto | Gris |
| `requesting` | `isConnecting` | "Selecciona el puerto..." | Opaco, disabled | Azul |
| `waiting` | Conectado sin datos | "Conectado · esperando datos" | Borde azul | Azul |
| `live` | Datos <10s | "Recibiendo datos · hace Xs" | Verde con pulso | Verde (pulse anim) |
| `stale` | Sin datos >10s | "Sin datos · hace Xs" | Rojo suave | Rojo |

Usa `useLastUpdate()` del store para detectar el estancamiento. Actualiza `now` cada 1s solo mientras hay conexión.

#### 5.8.2 SensorTable — `SensorTable.jsx`

| Columna | Contenido |
|---|---|
| Nodo | Nombre capitalizado del nodo (ej: `Selva-01`) |
| Tipo | Badge "Selva" (verde) |
| Lectura | `XX.X°C · XX.X% hum` |
| Estado | Badge "Normal" (verde) o "Alerta" (rojo) si temp ≥ 40°C |

#### 5.8.3 StatCard — `StatCard.jsx`

Componente genérico de tarjeta estadística:

```jsx
<StatCard
  title="Alarmas Activas"
  value={3}
  color="danger"
  icon="<path SVG>"
  trend={{ type: 'up', value: '+2 hoy' }}
/>
```

Variantes de color: `danger` (rojo), `success` (verde), `dark` (negro), `primary` (verde EcoMesh).

#### 5.8.4 AlarmChart — `AlarmChart.jsx`

Gráfico de barras agrupadas con Recharts. Muestra 3 métricas (incendios, inundaciones, contaminación) en intervalos de 2 horas durante 24h. Datos mock estáticos.

#### 5.8.5 DashboardLayout — `DashboardLayout.jsx`

Layout con `HeaderDashboard` + `Sidebar` + `<Outlet />` (donde se renderiza Dashboard).

#### 5.8.6 Sidebar — `Sidebar.jsx`

Navegación lateral con 5 ítems (Dashboard, Nodos, Alertas, Sensores, Reportes). Usa `NavLink` de React Router con clase `--active`. En responsive se vuelve horizontal.

#### 5.8.7 HeaderDashboard — `HeaderDashboard.jsx`

Barra superior con link "Volver al inicio" y avatar de usuario "Admin".

### 5.9 Componentes Generales

#### 5.9.1 PrettyModal — `PrettyModal.js`

Clase que usa **GSAP Flip** para animar transiciones de `<dialog>`:

- **`open(dialogID, event)`**: anima desde el elemento que disparó el evento (el botón) hacia el centro de la pantalla
- **`close(dialogID, event)`**: invierte la animación, volviendo el modal a la posición del botón original

Animaciones incluidas:
- Morphing de posición/tamaño con `Flip.from()` y `Flip.to()`
- Transición de `borderRadius` (botón redondo → modal con esquinas)
- Escala elástica en apertura: `scale(1.05, 0.93) → scale(1, 1)` con `elastic.out`
- Crossfade de opacidad en contenido al cerrar

Se expone globalmente como `window.prettyModal`.

#### 5.9.2 LoginModal — `LoginModal.jsx`

Formulario de login dentro de un `<dialog>`:
- Campos: email + contraseña
- Al enviar: cierra el modal con PrettyModal y navega a `/dashboard`
- Botón de cerrar con icono X
- Estilo con borde verde `#02542D` en focus

---

## 6. Estilos CSS

**Archivo:** `src/styles/index.css` (~722 líneas)

### 6.1 Variables CSS

```css
:root {
  --eco-green: #02542D;
  --eco-black: #000000;
  --eco-gray-bg: #D9D9D9;
  --eco-gray-light: #F5F5F5;
  --eco-white: #FFFFFF;
  --eco-text: #111111;
  --eco-text-secondary: #666666;
  --eco-border: #E5E5E5;
  --eco-danger: #DC2626;
  --eco-warning: #F59E0B;
  --eco-success: #10B981;
  --eco-info: #3B82F6;
}
```

### 6.2 Secciones del CSS

| Sección | Descripción |
|---|---|
| Reset global | `* { margin: 0; padding: 0; box-sizing: border-box; }` |
| Landing | Fondo gris, imagen con clip-path SVG, tipografía "Germania One" |
| Modal | Dialog centrado con backdrop transparente, inputs con focus verde |
| Dashboard | Layout flexbox, sidebar 240px verde, contenido fluido |
| HeaderDashboard | Barra blanca de 64px con avatar verde |
| Sidebar | Fondo verde oscuro, íconos SVG, hover semitransparente |
| StatCard | Grid de 4 columnas, tarjetas blancas con sombra, hover elevación |
| AlarmChart | Tarjeta blanca con el gráfico responsivo |
| SensorTable | Tabla con badges de tipo y estado, fila vacía con mensaje |
| SerialConnect | Botón pill con dot animado, estados de color, mensaje de error |
| Responsive (768px) | Sidebar horizontal, stats 2 columnas, clip-path desactivado |

### 6.3 Animación Serial Pulse

```css
@keyframes serial-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}
```

Aplicada al dot verde cuando el botón está en estado `live`.

---

## 7. Datos Mock

**Archivo:** `src/data/mockData.js`

Sirven como referencia/fallback para componentes que aún no consumen datos reales:

| Exportación | Tipo | Contenido |
|---|---|---|
| `alarmasActivas` | number | `3` |
| `nodosOnline` | number | `12` |
| `nodosOffline` | number | `2` |
| `sensoresActivos` | number | `36` |
| `ultimasAlarmas` | array | 3 alarmas con id, tipo, nodo, fecha, estado |
| `lecturasRecientes` | array | 6 lecturas mixtas (selva + río) con varios estados |
| `alarmasPorHora` | array | 12 entradas (cada 2h) con incendios, inundaciones, contaminación |

Los `StatCard` y `AlarmChart` **aún usan estos datos mock**. La `SensorTable` ya consume datos reales del `sensorStore`.

---

## 8. Configuración del Proyecto

### 8.1 package.json

```json
{
  "name": "ecomesh",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "gsap": "^3.12.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.18.1",
    "recharts": "^3.10.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.10"
  }
}
```

### 8.2 vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### 8.3 index.html

Entry point HTML con fuente "Germania One" de Google Fonts y el div `#root`.

---

## 9. Consideraciones Técnicas

### 9.1 Limitaciones Conocidas

| Limitación | Detalle |
|---|---|
| **Web Serial** | Solo funciona en Chrome/Edge con origen seguro (localhost o HTTPS) |
| **Persistencia** | Los datos se pierden al recargar la página |
| **Canal WiFi** | El receptor debe fijar canal 1 antes de `esp_now_init()` |
| **Fragmentación de heap** | Usar `snprintf`/`dtostrf`, nunca concatenar `String` con `+` en Arduino |
| **Contador de lecturas** | Máximo 50 lecturas por nodo en memoria |
| **Serial Monitor** | No puede estar abierto en el Arduino IDE al conectar desde el navegador |

### 9.2 Puertos USB Compatibles

| Chip | Vendor ID | Placas típicas |
|---|---|---|
| CP2102 | `0x10C4` | ESP8266 (NodeMCU v2, Wemos D1 mini) |
| CH340 | `0x1A86` | ESP32-S, Arduino Nano clones |
| FT232 | `0x0403` | FTDI adapters |

### 9.3 Formato de Paquete ESP-NOW

```
┌──────────────────────────────────────────┐
│  float temperatura  (4 bytes)            │
│  float humedad      (4 bytes)            │
└──────────────────────────────────────────┘
Total: 8 bytes por paquete
```

### 9.4 Secuencia de Arranque

```
ESP32-S: setup() → WiFi.mode(STA) → set_channel(1)
         → esp_now_init() → register_send_cb → add_peer
         → loop(): read_sensor → esp_now_send → delay(3000)

ESP8266: setup() → Serial.begin(115200) → WiFi.mode(STA)
         → wifi_set_channel(1) → esp_now_init()
         → set_role(SLAVE) → register_recv_cb
         → loop(): idle (interrupciones)

PC:      npm run dev → localhost:5173 → click "Conectar ESP8266"
         → navigator.serial.requestPort() → port.open(115200)
         → readLoop() → pushReading() → render
```

### 9.5 Expansión Futura

- Múltiples nodos ESP32-S: el `nodeIds` en el store ya soporta múltiples entradas
- Tipos de nodo: actualmente solo "Selva" (temp+hum). Se puede agregar "Río" (pH, turbidez, nivel) modificando el JSON del ESP y el normalize del store
- Persistencia: se podría agregar IndexedDB o localStorage (con límite de datos)
- Notificaciones: el flag `stale` (>10s sin datos) está implementado en el botón

---

> **Documentación generada a partir del código fuente del proyecto EcoMesh.**
> Proyecto académico — Universidad Nacional Experimental de Guayana, Julio 2026.
