# 🚀 Farm Monitoring - Quick Start

## ⚡ 5-Minute Setup

### 1. Get Adafruit IO Credentials (2 min)
```
1. Go to https://io.adafruit.com/
2. Sign up / Login
3. Click "My Key"
4. Copy Username and Active Key
```

### 2. Create Feeds (1 min)
Create these three feeds:
- **dht-temp**
- **dht-hum**  
- **soil-moisture**

### 3. Configure Backend (1 min)
Edit `FarmerAI-backend/.env`:
```bash
ADAFRUIT_IO_USERNAME=your_username
ADAFRUIT_IO_KEY=your_key
```

### 4. Restart & Test (1 min)
```bash
# Restart backend
cd FarmerAI-backend
npm start

# Access dashboard
# Navigate to: http://localhost:5173/farm-monitoring
# Click "Fetch New Data"
```

---

## 📱 ESP32 Quick Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* AIO_USERNAME = "YOUR_USERNAME";
const char* AIO_KEY = "YOUR_KEY";

#define DHTPIN 4
#define SOIL_PIN 34
DHT dht(DHTPIN, DHT11);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(1000);
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int soil = analogRead(SOIL_PIN);
  
  if (!isnan(temp) && !isnan(hum)) {
    sendToAdafruit("dht-temp", String(temp));
    sendToAdafruit("dht-hum", String(hum));
    sendToAdafruit("soil-moisture", String(soil));
  }
  delay(10000);
}

void sendToAdafruit(String feed, String value) {
  HTTPClient http;
  String url = "https://io.adafruit.com/api/v2/" + String(AIO_USERNAME) + "/feeds/" + feed + "/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-AIO-Key", AIO_KEY);
  http.POST("{\"value\":\"" + value + "\"}");
  http.end();
}
```

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 📊 Real-time Data | Temperature, Humidity, Soil Moisture |
| 🔄 Auto-refresh | Every 5 minutes (automatic) or on-demand |
| 📈 Charts | Historical trends with Recharts |
| 🚨 Alerts | Irrigation warnings |
| 📅 Time Range | 1 hour to 7 days |

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "No data" | Click "Fetch New Data" |
| "Credentials error" | Check `.env` file |
| ESP32 not sending | Check WiFi & serial monitor |
| Charts empty | Fetch data multiple times |

---

## 📡 API Endpoints

```bash
# Fetch new data
POST /api/farm-monitoring/fetch

# Get latest
GET /api/farm-monitoring/latest

# Get history
GET /api/farm-monitoring/history?hours=24&limit=100

# Get stats
GET /api/farm-monitoring/stats?hours=24
```

---

## 💡 Tips

1. **Test First**: Use "Manually add data" API for testing without ESP32
2. **Check Feeds**: Verify data in Adafruit IO dashboard
3. **Monitor Logs**: Watch backend console for errors
4. **Optimal Refresh**: 10-30 seconds for balance between updates and API limits

---

## 🎨 Customization

### Change Irrigation Threshold
`FarmerAI-backend/src/models/SensorData.js`
```javascript
return this.soilMoisture < 300; // Change 300 to your value
```

### Change Auto-refresh Time
`farmerai-frontend/src/pages/FarmMonitoring.jsx`
```javascript
setInterval(() => { /* ... */ }, 300000); // Change 300000 (ms) for 5 minutes
```

### Auto-fetch Schedule
The system now automatically fetches data every 5 minutes via a background scheduler.

---

## ✅ Success Indicators

- [ ] ESP32 sending data (check serial monitor)
- [ ] Data visible in Adafruit IO feeds
- [ ] Backend fetches without errors
- [ ] Dashboard shows current readings
- [ ] Charts display historical data
- [ ] Status message shows correctly
- [ ] Auto-refresh working

---

## 📖 Full Documentation
See `FARM_MONITORING_SETUP.md` for detailed instructions.

---

**Happy Monitoring! 🌾**
