import { useCallback, useEffect, useRef, useState } from 'react';

// Conexión al ESP8266 receptor por Web Serial API (Chrome/Edge, origen seguro).
// Chips USB-serie habituales en placas ESP: el receptor puede traer cualquiera de ellos.
const USB_FILTERS = [
  { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
  { usbVendorId: 0x1a86 }, // QinHeng CH340 / CH9102
  { usbVendorId: 0x0403 }, // FTDI
];
const BAUD_RATE = 115200;

export function isSerialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

// Parte el stream de texto en líneas completas.
class LineBreakTransformer {
  constructor() {
    this.buffer = '';
  }

  transform(chunk, controller) {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() ?? '';
    lines.forEach((line) => controller.enqueue(line));
  }

  flush(controller) {
    if (this.buffer) controller.enqueue(this.buffer);
    this.buffer = '';
  }
}

// El firmware mezcla JSON con líneas de depuración: solo nos interesan las que son JSON.
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/**
 * @param {{ onReading?: (reading: object) => void, onLine?: (line: string) => void }} handlers
 * @returns {{ connect: () => Promise<void>, disconnect: () => Promise<void>,
 *             isConnected: boolean, isConnecting: boolean, error: string|null,
 *             supported: boolean }}
 */
export default function useSerialPort({ onReading, onLine } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const pipeClosedRef = useRef(null);
  const handlersRef = useRef({ onReading, onLine });

  useEffect(() => {
    handlersRef.current = { onReading, onLine };
  }, [onReading, onLine]);

  // Libera reader, pipe y puerto. Silencioso: cerrar dos veces no debe romper nada.
  const teardown = useCallback(async () => {
    const reader = readerRef.current;
    const pipeClosed = pipeClosedRef.current;
    const port = portRef.current;

    readerRef.current = null;
    pipeClosedRef.current = null;
    portRef.current = null;

    if (reader) {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    if (pipeClosed) await pipeClosed.catch(() => {});
    if (port) await port.close().catch(() => {});
  }, []);

  const readLoop = useCallback(async (reader) => {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      const { onReading: handleReading, onLine: handleLine } = handlersRef.current;
      if (import.meta.env.DEV) console.debug('[serial]', value);
      handleLine?.(value);

      const data = parseLine(value);
      if (data) handleReading?.(data);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await teardown();
    setIsConnected(false);
    setIsConnecting(false);
  }, [teardown]);

  const connect = useCallback(async () => {
    if (!isSerialSupported()) {
      setError('Este navegador no soporta Web Serial. Usa Chrome o Edge en localhost.');
      return;
    }
    if (portRef.current) return;

    setError(null);
    setIsConnecting(true);

    let port;
    try {
      port = await navigator.serial.requestPort({ filters: USB_FILTERS });
      await port.open({ baudRate: BAUD_RATE });
    } catch (err) {
      setIsConnecting(false);
      if (err?.name === 'NotFoundError') {
        // El usuario cerró el diálogo del navegador sin elegir puerto
        setError(null);
      } else if (err?.name === 'InvalidStateError' || /open/i.test(err?.message ?? '')) {
        setError('No se pudo abrir el puerto. ¿Tienes el Monitor Serie del Arduino IDE abierto?');
      } else {
        setError(err?.message ?? 'No se pudo abrir el puerto');
      }
      return;
    }

    const decoder = new TextDecoderStream();
    const pipeClosed = port.readable.pipeTo(decoder.writable).catch(() => {});
    const reader = decoder.readable
      .pipeThrough(new TransformStream(new LineBreakTransformer()))
      .getReader();

    portRef.current = port;
    pipeClosedRef.current = pipeClosed;
    readerRef.current = reader;

    setIsConnecting(false);
    setIsConnected(true);

    readLoop(reader)
      .catch((err) => setError(err?.message ?? 'Error leyendo del puerto serie'))
      .finally(() => {
        // Cable desconectado o stream cerrado desde el otro lado
        if (readerRef.current === reader) disconnect();
      });
  }, [disconnect, readLoop]);

  // Desconexión física del USB
  useEffect(() => {
    if (!isSerialSupported()) return undefined;

    const onDisconnect = (event) => {
      if (event.target !== portRef.current) return;
      setError('El ESP8266 se desconectó del USB.');
      disconnect();
    };

    navigator.serial.addEventListener('disconnect', onDisconnect);
    return () => navigator.serial.removeEventListener('disconnect', onDisconnect);
  }, [disconnect]);

  // Cerrar el puerto al desmontar
  useEffect(() => () => { teardown(); }, [teardown]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    supported: isSerialSupported(),
  };
}
