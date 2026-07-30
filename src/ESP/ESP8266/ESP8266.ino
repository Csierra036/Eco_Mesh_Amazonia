#include <ESP8266WiFi.h>
#include <espnow.h>

extern "C" {
  #include <user_interface.h>  // wifi_set_channel()
}

// Debe coincidir con el canal del emisor (ESP32-S usa esp_wifi_set_channel(1))
#define WIFI_CHANNEL 1

// Identificador del nodo que se publica en el JSON hacia el frontend
static const char NODE_ID[] = "selva-01";

// La estructura DEBE ser exacta a la del emisor
typedef struct struct_message {
  float temperatura;
  float humedad;
} struct_message;

struct_message datosRecibidos;

// Función que se ejecuta automáticamente cuando entra un dato por radio
void OnDataRecv(uint8_t * mac, uint8_t *incomingData, uint8_t len) {
  if (len != sizeof(datosRecibidos)) {
    Serial.println("Paquete con tamaño inesperado, descartado");
    return;
  }

  memcpy(&datosRecibidos, incomingData, sizeof(datosRecibidos));

  // Línea JSON para el frontend (Web Serial): una lectura = una línea.
  // dtostrf en vez de concatenar String para no fragmentar el heap.
  char temp[12];
  char hum[12];
  dtostrf(datosRecibidos.temperatura, 0, 2, temp);
  dtostrf(datosRecibidos.humedad, 0, 2, hum);

  char json[96];
  snprintf(json, sizeof(json),
           "{\"node\":\"%s\",\"t\":%s,\"h\":%s,\"ts\":%lu}",
           NODE_ID, temp, hum, millis());
  Serial.println(json);

  // Depuración (el frontend ignora toda línea que no empiece por '{')
  Serial.println("=================================");
  Serial.println("¡Datos recibidos del ESP32-S!");
  Serial.print("Temperatura: ");
  Serial.print(datosRecibidos.temperatura);
  Serial.println(" °C");
  Serial.print("Humedad: ");
  Serial.print(datosRecibidos.humedad);
  Serial.println(" %");
  Serial.println("=================================\n");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Fijar el canal ANTES de esp_now_init(); si no, no llegan los paquetes del emisor
  wifi_set_channel(WIFI_CHANNEL);

  if (esp_now_init() != 0) {
    Serial.println("Error al inicializar ESP-NOW en ESP8266");
    return;
  }

  // Definir como esclavo/receptor y registrar callback
  esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
  esp_now_register_recv_cb(OnDataRecv);

  Serial.print("ESP8266 (Receptor) listo en canal ");
  Serial.print(WiFi.channel());
  Serial.println(", esperando datos...");
}

void loop() {
  // Sin código aquí, el receptor reacciona por interrupciones
}
