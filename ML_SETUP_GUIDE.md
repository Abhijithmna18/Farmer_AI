# FarmerAI ML Features Setup Guide

## Overview
This guide will help you set up and configure the 5 new Machine Learning features in your FarmerAI project.

## Prerequisites

### 1. Python Environment Setup
You'll need a Python environment to run the ML models. We recommend using a virtual environment:

```bash
# Create virtual environment
python -m venv farmerai-ml
source farmerai-ml/bin/activate  # On Windows: farmerai-ml\Scripts\activate

# Install required packages
pip install tensorflow scikit-learn pandas numpy opencv-python pillow fastapi uvicorn pydantic
```

### 2. Node.js Dependencies
The ML service requires additional Node.js packages:

```bash
cd FarmerAI-backend
npm install tensorflow @tensorflow/tfjs-node axios multer
```

### 3. Environment Variables
Add these environment variables to your `.env` file:

```env
# ML Service Configuration
ML_SERVICE_URL=http://localhost:8000
ML_MODEL_PATH=./ml-models

# Hugging Face API (for plant disease detection)
HF_API_TOKEN=your_huggingface_token

# Google Gemini API (for AI assistance)
GEMINI_API_KEY=your_gemini_api_key

# Weather API (for irrigation optimization)
WEATHER_API_KEY=your_weather_api_key

# Market Data API (for price prediction)
MARKET_DATA_API_KEY=your_market_data_api_key
```

## ML Features Implementation

### 1. Disease Detection & Treatment Recommendation

#### Features:
- Plant disease identification from images
- Treatment recommendations
- Prevention strategies
- Historical tracking

#### Setup:
1. **Model Training** (Optional - uses pre-trained model):
```bash
# Download PlantVillage dataset
wget https://data.mendeley.com/datasets/tywbtsjrjv/1/files/d5542a28-b1d5-4c21-9a93-7a8745614c3a/PlantVillage.zip
unzip PlantVillage.zip

# Train custom model (optional)
python ml-models/disease-detection/train_model.py
```

2. **API Endpoints**:
- `POST /api/ml/disease/detect` - Upload image for disease detection
- `GET /api/ml/disease/history` - Get detection history
- `GET /api/ml/disease/treatments/:diseaseType` - Get treatment recommendations

#### Usage Example:
```javascript
// Frontend integration
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/ml/disease/detect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log('Disease detected:', result.data.diseaseType);
console.log('Treatment:', result.data.treatment);
```

### 2. Smart Irrigation Optimization

#### Features:
- Optimal irrigation scheduling
- Water usage prediction
- Weather-based adjustments
- Cost-benefit analysis

#### Setup:
1. **Data Collection**:
```javascript
// Collect sensor data
const sensorData = {
  temperature: 25.5,
  humidity: 60,
  soilMoisture: 0.4,
  lightIntensity: 800
};

// Get weather forecast
const weatherData = await fetch('/api/weather/forecast');
```

2. **API Endpoints**:
- `POST /api/ml/irrigation/optimize` - Get optimized irrigation schedule
- `GET /api/ml/irrigation/schedule/:farmId` - Get current schedule
- `GET /api/ml/irrigation/forecast/:farmId` - Get water usage forecast

#### Usage Example:
```javascript
const irrigationData = {
  farmId: 'farm123',
  cropType: 'Tomatoes',
  soilType: 'Loamy',
  area: 2.5,
  sensorData: sensorData,
  weatherData: weatherData
};

const response = await fetch('/api/ml/irrigation/optimize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(irrigationData)
});
```

### 3. Pest Detection & Management

#### Features:
- Real-time pest identification
- Damage assessment
- Treatment recommendations
- Pest lifecycle tracking

#### Setup:
1. **Model Setup**:
```bash
# Download pest detection model
wget https://github.com/example/pest-detection-model/releases/latest/download/pest_model.h5
mv pest_model.h5 ml-models/pest-detection/
```

2. **API Endpoints**:
- `POST /api/ml/pest/detect` - Upload image for pest detection
- `GET /api/ml/pest/history` - Get detection history
- `GET /api/ml/pest/treatments/:pestType` - Get treatment options

#### Usage Example:
```javascript
const formData = new FormData();
formData.append('image', pestImageFile);
formData.append('farmId', 'farm123');
formData.append('location', JSON.stringify({lat: 12.9716, lng: 77.5946}));

const response = await fetch('/api/ml/pest/detect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 4. Crop Health Monitoring & Anomaly Detection

#### Features:
- Real-time health scoring
- Anomaly detection in sensor data
- Early warning system
- Trend analysis

#### Setup:
1. **Sensor Data Integration**:
```javascript
// Monitor health continuously
const healthData = {
  farmId: 'farm123',
  sensorData: {
    temperature: 25.5,
    humidity: 60,
    soilMoisture: 0.4,
    lightIntensity: 800
  }
};

const response = await fetch('/api/ml/health/monitor', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(healthData)
});
```

2. **API Endpoints**:
- `POST /api/ml/health/monitor` - Analyze sensor data
- `GET /api/ml/health/score/:farmId` - Get current health score
- `GET /api/ml/health/anomalies/:farmId` - Get detected anomalies

### 5. Predictive Analytics for Market Prices

#### Features:
- Price forecasting (1-6 months ahead)
- Market trend analysis
- Seasonal pattern recognition
- Investment recommendations

#### Setup:
1. **Market Data Integration**:
```javascript
// Get price forecast
const response = await fetch('/api/ml/price/forecast/Rice?days=30', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const forecast = await response.json();
console.log('Price forecast:', forecast.data.predictions);
```

2. **API Endpoints**:
- `GET /api/ml/price/forecast/:crop` - Get price forecast
- `GET /api/ml/price/trends` - Get market trends
- `POST /api/ml/price/alert` - Set price alerts

## Frontend Integration

### 1. Disease Detection Component
```jsx
import React, { useState } from 'react';

const DiseaseDetection = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImage(file);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/ml/disease/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      setResult(data.data);
    } catch (error) {
      console.error('Error detecting disease:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="disease-detection">
      <h2>Plant Disease Detection</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        disabled={loading}
      />
      
      {loading && <p>Analyzing image...</p>}
      
      {result && (
        <div className="result">
          <h3>Detection Result</h3>
          <p><strong>Disease:</strong> {result.diseaseType}</p>
          <p><strong>Confidence:</strong> {result.confidence}%</p>
          <p><strong>Treatment:</strong> {result.treatment}</p>
          <p><strong>Prevention:</strong> {result.prevention}</p>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
```

### 2. Irrigation Optimization Component
```jsx
import React, { useState, useEffect } from 'react';

const IrrigationOptimization = ({ farmId }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  const optimizeIrrigation = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/ml/irrigation/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          farmId,
          cropType: 'Tomatoes',
          soilType: 'Loamy',
          area: 2.5
        })
      });

      const data = await response.json();
      setSchedule(data.data);
    } catch (error) {
      console.error('Error optimizing irrigation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="irrigation-optimization">
      <h2>Smart Irrigation</h2>
      <button onClick={optimizeIrrigation} disabled={loading}>
        {loading ? 'Optimizing...' : 'Optimize Irrigation'}
      </button>
      
      {schedule && (
        <div className="schedule">
          <h3>Optimized Schedule</h3>
          <p><strong>Water Usage:</strong> {schedule.waterUsage}L</p>
          <p><strong>Efficiency:</strong> {schedule.efficiency}%</p>
          <div className="schedule-list">
            {schedule.schedule.map((session, index) => (
              <div key={index} className="schedule-item">
                <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                <p><strong>Amount:</strong> {session.amount}L</p>
                <p><strong>Duration:</strong> {session.duration} minutes</p>
                <p><strong>Reason:</strong> {session.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IrrigationOptimization;
```

## Testing the ML Features

### 1. Test Disease Detection
```bash
# Test with sample image
curl -X POST http://localhost:5002/api/ml/disease/detect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@sample_plant_image.jpg"
```

### 2. Test Irrigation Optimization
```bash
curl -X POST http://localhost:5002/api/ml/irrigation/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "farmId": "farm123",
    "cropType": "Tomatoes",
    "soilType": "Loamy",
    "area": 2.5
  }'
```

### 3. Test Health Monitoring
```bash
curl -X POST http://localhost:5002/api/ml/health/monitor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "farmId": "farm123",
    "sensorData": {
      "temperature": 25.5,
      "humidity": 60,
      "soilMoisture": 0.4,
      "lightIntensity": 800
    }
  }'
```

## Monitoring and Maintenance

### 1. Model Performance Monitoring
- Monitor accuracy metrics
- Track prediction confidence
- Update models with new data

### 2. Data Quality Assurance
- Validate input data
- Monitor sensor data quality
- Implement data cleaning pipelines

### 3. User Feedback Integration
- Collect user feedback on predictions
- Implement feedback loops
- Continuously improve models

## Troubleshooting

### Common Issues:

1. **ML Service Not Responding**
   - Check if Python ML service is running
   - Verify ML_SERVICE_URL environment variable
   - Check model files are present

2. **Image Upload Issues**
   - Verify multer configuration
   - Check file size limits
   - Ensure proper file permissions

3. **Database Connection Issues**
   - Verify MongoDB connection
   - Check model schemas
   - Ensure proper indexing

4. **API Authentication Issues**
   - Verify JWT token
   - Check user permissions
   - Ensure proper middleware setup

## Support

For technical support or questions about the ML features:
- Check the logs in `FarmerAI-backend/logs/`
- Review the ML service logs
- Contact the development team

## Conclusion

The ML features provide powerful capabilities for agricultural decision-making. Follow this guide to set up and integrate these features into your FarmerAI platform. Remember to test thoroughly and monitor performance regularly.

