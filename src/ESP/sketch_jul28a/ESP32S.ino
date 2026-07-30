#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_HTU21DF.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

// MAC de tu ESP8266 (C8:C9:A3:14:1B:10)
uint8_t receptorMAC[] = {0xC8, 0xC9, 0xA3, 0x14, 0x1B, 0x10};

typedef struct struct_message {
  float temperatura;
  float humedad;
} struct_message;

struct_message datosEnviar;
Adafruit_HTU21DF htu = Adafruit_HTU21DF();
esp_now_peer_info_t peerInfo;

// Callback corregido para ESP32 Core v3.x
void OnDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  Serial.print("Estado del envío: ");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Entregado con éxito" : "Error en el envío");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n--- Iniciando ESP32-S Emisor ---");

  // Inicializar I2C para HTU21D (SDA=21, SCL=22)
  Wire.begin(21, 22);
  if (!htu.begin()) {
    Serial.println("Error: No se encontró el sensor HTU21D.");
  } else {
    Serial.println("Sensor HTU21D inicializado.");
  }

  // Fijar canal Wi-Fi 1 para sincronizar con ESP8266
  WiFi.mode(WIFI_STA);
  esp_wifi_set_channel(1, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error al inicializar ESP-NOW");
    return;
  }

  esp_now_register_send_cb(OnDataSent);

  // Registrar el ESP8266 como nodo destino
  memcpy(peerInfo.peer_addr, receptorMAC, 6);
  peerInfo.channel = 1;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Error al registrar el nodo receptor");
    return;
  }
}

void loop() {
  float temp = htu.readTemperature();
  float hum = htu.readHumidity();

  if (isnan(temp) || isnan(hum)) {
    Serial.println("Error al leer el HTU21D.");
  } else {
    datosEnviar.temperatura = temp;
    datosEnviar.humedad = hum;

    Serial.print("Enviando -> Temp: ");
    Serial.print(temp);
    Serial.print(" °C | Hum: ");
    Serial.print(hum);
    Serial.println(" %");

    esp_now_send(receptorMAC, (uint8_t *) &datosEnviar, sizeof(datosEnviar));
  }

  delay(3000); // Transmitir cada 3 segundos
}
