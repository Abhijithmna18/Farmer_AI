# 🌾 Farm Monitoring Setup Guide

## Overview

The Farm Monitoring feature integrates ESP32 sensor data (DHT11 temperature/humidity and soil moisture sensor) with your FarmerAI application through Adafruit IO. This enables real-time monitoring of environmental conditions and historical trend analysis.

---

## 📋 Prerequisites

1. **ESP32 Board** with:
   - DHT11 sensor (Temperature & Humidity)
   - Soil Moisture sensor
2. **Adafruit IO Account** (free tier is sufficient)
3. **MongoDB Atlas** (already configured in your project)
4. **Recharts** library (already installed in your project)

---

## 🔧 Setup Instructions

### Step 1: Configure Adafruit IO

#### 1.1 Create Adafruit IO Account
1. Go to [https://io.adafruit.com/](https://io.adafruit.com/)
2. Sign up for a free account
3. Verify your email

#### 1.2 Get Your Credentials
1. Log in to Adafruit IO
2. Click on **"My Key"** in the top navigation
3. Copy your:
   - **Username** (e.g., `yourname`)
   - **Active Key** (your API key)

#### 1.3 Create Feeds
Create three feeds for your sensor data:
1. Go to **Feeds** → **Create a New Feed**
2. Create these feeds:
   - **Name:** `dht-temp`, **Key:** `dht-temp`
   - **Name:** `dht-hum`, **Key:** `dht-hum`
   - **Name:** `soil-moisture`, **Key:** `soil-moisture`

**Important:** Make sure the feed keys match exactly as shown above!

---

### Step 2: Configure ESP32 to Send Data to Adafruit IO

#### 2.1 ESP32 Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Adafruit IO credentials
const char* AIO_USERNAME = "your_adafruit_username";
const char* AIO_KEY = "your_adafruit_io_key";

// Sensor pins
#define DHTPIN 4          // DHT11 connected to GPIO 4
#define DHTTYPE DHT11
#define SOIL_PIN 34       // Soil moisture sensor connected to GPIO 34

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Read sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soilMoisture = analogRead(SOIL_PIN);
  
  if (!isnan(temperature) && !isnan(humidity)) {
    // Send to Adafruit IO
    sendToAdafruit("dht-temp", String(temperature));
    sendToAdafruit("dht-hum", String(humidity));
    sendToAdafruit("soil-moisture", String(soilMoisture));
    
    Serial.println("Data sent successfully!");
  }
  
  delay(10000); // Send every 10 seconds
}

void sendToAdafruit(String feed, String value) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "https://io.adafruit.com/api/v2/" + String(AIO_USERNAME) + "/feeds/" + feed + "/data";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-AIO-Key", AIO_KEY);
    
    String jsonData = "{\"value\":\"" + value + "\"}";
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      Serial.println(feed + ": " + value + " - Status: " + String(httpCode));
    }
    http.end();
  }
}
```

#### 2.2 Upload Code to ESP32
1. Install Arduino IDE and ESP32 board support
2. Install DHT sensor library: `DHT sensor library by Adafruit`
3. Update WiFi credentials and Adafruit IO credentials
4. Upload the code to your ESP32
5. Verify data is being sent to Adafruit IO feeds

---

### Step 3: Configure Backend Environment Variables

#### 3.1 Add Adafruit IO Credentials

Edit `FarmerAI-backend/.env` and add:

```bash
# Adafruit IO Configuration
ADAFRUIT_IO_USERNAME=your_adafruit_username
ADAFRUIT_IO_KEY=your_adafruit_io_key
```

**Replace** `your_adafruit_username` and `your_adafruit_io_key` with your actual credentials from Step 1.2.

#### 3.2 Verify MongoDB Connection

Ensure your MongoDB connection string is configured:

```bash
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/farmerai?retryWrites=true&w=majority
```

---

### Step 4: Restart Backend Server

```bash
cd FarmerAI-backend
npm start
```

You should see:
```
✅ Server running on http://localhost:5000
✅ Connected to MongoDB
```

---

### Step 5: Test the Feature

#### 5.1 Access Farm Monitoring Dashboard

1. Start your frontend:
   ```bash
   cd farmerai-frontend
   npm run dev
   ```

2. Log in to your FarmerAI application

3. Navigate to **🌾 Farm Monitoring** in the sidebar

#### 5.2 Fetch Sensor Data

1. Click **"Fetch New Data"** button
2. The system will:
   - Fetch latest data from Adafruit IO
   - Save it to MongoDB
   - Display on the dashboard

#### 5.3 Verify Data Display

You should see:
- ✅ Latest temperature reading
- ✅ Latest humidity reading
- ✅ Latest soil moisture reading
- ✅ Status message (e.g., "Irrigation Needed" if soil moisture < 300)
- ✅ Historical trend charts

---

## 🎯 Features

### 1. **Real-time Sensor Readings**
- Temperature (°C)
- Humidity (%)
- Soil Moisture (0-4095 scale)

### 2. **Live Updates**
- Auto-refresh every 10 seconds
- Manual refresh with "Fetch New Data" button

### 3. **Historical Trends**
- Interactive charts using Recharts
- Configurable time range (1 hour to 7 days)
- Temperature & Humidity combined chart
- Soil Moisture area chart

### 4. **Smart Alerts**
- 🔴 **Irrigation Needed**: Soil moisture < 300
- 🟡 **Soil Moisture Low**: Soil moisture 300-499
- 🟢 **Normal**: Soil moisture ≥ 500

### 5. **Statistics**
- Min, Max, Average values
- Customizable time period

---

## 📡 API Endpoints

### Backend Routes (`/api/farm-monitoring`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/fetch` | Fetch from Adafruit IO and save to DB |
| GET | `/latest` | Get latest sensor reading |
| GET | `/history?hours=24&limit=100` | Get historical data |
| GET | `/stats?hours=24` | Get statistics |
| POST | `/add` | Manually add sensor data (testing) |
| DELETE | `/cleanup?days=30` | Delete old data |

---

## 🧪 Testing

### Test 1: Manual Data Entry

You can manually add test data using the API:

```bash
curl -X POST http://localhost:5000/api/farm-monitoring/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "temperature": 28.5,
    "humidity": 65.0,
    "soilMoisture": 450
  }'
```

### Test 2: Verify Adafruit IO Connection

Test if backend can fetch from Adafruit IO:

```bash
curl -X POST http://localhost:5000/api/farm-monitoring/fetch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Sensor data fetched and stored successfully",
  "data": {
    "temperature": 28.5,
    "humidity": 65.0,
    "soilMoisture": 450,
    "timestamp": "2025-01-21T10:30:00.000Z"
  }
}
```

---

## 🔍 Troubleshooting

### Problem 1: "Adafruit IO credentials not configured"

**Solution:**
1. Check `.env` file has correct credentials
2. Restart backend server
3. Verify credentials are correct in Adafruit IO dashboard

### Problem 2: "No sensor data available"

**Possible causes:**
1. ESP32 not sending data to Adafruit IO
2. Wrong feed names in Adafruit IO
3. Network connectivity issues

**Solutions:**
1. Check ESP32 serial monitor for errors
2. Verify feeds exist in Adafruit IO dashboard
3. Check feed names match exactly: `temperature`, `humidity`, `soil-moisture`

### Problem 3: Charts not displaying

**Solution:**
1. Ensure historical data exists (click "Fetch New Data" multiple times)
2. Check browser console for errors
3. Verify Recharts is installed: `npm list recharts`

### Problem 4: Auto-refresh not working

**Solution:**
1. Check browser console for errors
2. Ensure you're logged in (JWT token valid)
3. Try manual refresh first

---

## 📊 Data Flow Diagram

```
ESP32 Sensors → WiFi → Adafruit IO Feeds
                              ↓
                    FarmerAI Backend (on-demand fetch)
                              ↓
                         MongoDB Atlas
                              ↓
                    React Frontend Dashboard
                              ↓
                    Recharts Visualization
```

---

## 🎨 Customization

### Change Irrigation Threshold

Edit `FarmerAI-backend/src/models/SensorData.js`:

```javascript
sensorDataSchema.virtual('needsIrrigation').get(function() {
  return this.soilMoisture < 300; // Change this value
});
```

### Change Auto-refresh Interval

Edit `farmerai-frontend/src/pages/FarmMonitoring.jsx`:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchLatest();
    fetchHistory();
  }, 300000); // Change 300000 to desired milliseconds (5 minutes)
  
  return () => clearInterval(interval);
}, [fetchLatest, fetchHistory]);
```

### Scheduled Data Fetching

The system now automatically fetches data every 5 minutes via a background scheduler that runs on the server. This reduces the load on the frontend and ensures consistent data collection even when users aren't actively viewing the dashboard.

### Add More Sensors

1. Create new feeds in Adafruit IO
2. Update ESP32 code to send new sensor data
3. Update `adafruit.service.js` to fetch new feeds
4. Update `SensorData` model with new fields
5. Update frontend dashboard to display new data

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** to git
2. **Use environment variables** for all credentials
3. **Rotate Adafruit IO keys** periodically
4. **Limit API access** to authenticated users only
5. **Enable HTTPS** in production

---

## 📈 Future Enhancements

Potential improvements you can add:

1. **Email/SMS Alerts**: Notify when irrigation needed
2. **Automated Irrigation**: Trigger water pumps via ESP32
3. **Multiple Locations**: Support multiple farms/sensors
4. **Weather Integration**: Combine with weather API data
5. **ML Predictions**: Predict optimal irrigation times
6. **Mobile App**: React Native companion app
7. **Data Export**: Download sensor data as CSV/Excel
8. **Custom Dashboards**: User-configurable widgets

---

## 📞 Support

### Common Questions

**Q: How often does ESP32 send data?**  
A: Configurable in ESP32 code (default: every 10 seconds)

**Q: How often is data fetched from Adafruit IO?**  
A: Every 5 minutes via a background scheduler, plus on-demand when users click "Fetch New Data"

**Q: How long is data stored?**  
A: Indefinitely in MongoDB. Use cleanup endpoint to delete old data.

**Q: Can I use different sensors?**  
A: Yes! Just update ESP32 code and Adafruit IO feeds accordingly.

**Q: Does this work offline?**  
A: No, requires internet connection for Adafruit IO integration.

---

## ✅ Checklist

Before going live, ensure:

- [ ] Adafruit IO account created and verified
- [ ] Three feeds created: `temperature`, `humidity`, `soil-moisture`
- [ ] ESP32 configured and sending data to Adafruit IO
- [ ] Backend `.env` has Adafruit IO credentials
- [ ] MongoDB connection working
- [ ] Backend server running without errors
- [ ] Frontend accessible and Farm Monitoring page loads
- [ ] "Fetch New Data" successfully retrieves sensor data
- [ ] Charts display correctly
- [ ] Auto-refresh working (check every 5 minutes)
- [ ] Status alerts showing correctly

---

## 🎉 Success!

Once everything is set up, you'll have a fully functional Farm Monitoring dashboard that:

- ✅ Displays real-time sensor data
- ✅ Shows historical trends with beautiful charts
- ✅ Alerts you when irrigation is needed
- ✅ Updates automatically every 5 minutes (background scheduler)
- ✅ Stores all data in MongoDB for analysis

Happy farming! 🌾🚜

---

**Created by:** FarmerAI Team  
**Last Updated:** January 2025  
**Version:** 1.0
