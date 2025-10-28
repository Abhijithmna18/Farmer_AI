// Test Local ML Service
require('dotenv').config();
const MLService = require('./src/ml/services/ml-service');

async function testLocalML() {
  console.log('🚀 Testing Local ML Service...\n');

  try {
    // Test 1: Disease Detection
    console.log('1. Testing Disease Detection...');
    const diseaseResult = await MLService.detectDisease('test-image.jpg', 'user123');
    console.log('✅ Disease Detection Result:', diseaseResult.data);
    console.log('');

    // Test 2: Irrigation Optimization
    console.log('2. Testing Irrigation Optimization...');
    const irrigationData = {
      cropType: 'Tomatoes',
      soilType: 'Loamy',
      area: 2.5,
      sensorData: {
        temperature: 25.5,
        humidity: 60,
        soilMoisture: 0.4,
        lightIntensity: 800
      },
      weatherData: {
        forecast: [{
          temperature: 28,
          humidity: 65,
          rainfall: 0
        }]
      }
    };
    
    const irrigationResult = await MLService.optimizeIrrigation(irrigationData);
    console.log('✅ Irrigation Optimization Result:');
    console.log('   Water Usage:', irrigationResult.data.waterUsage, 'L');
    console.log('   Efficiency:', irrigationResult.data.efficiency, '%');
    console.log('   Schedule Days:', irrigationResult.data.schedule.length);
    console.log('');

    // Test 3: Pest Detection
    console.log('3. Testing Pest Detection...');
    const pestResult = await MLService.detectPest('test-pest.jpg', 'farm123', {lat: 12.9716, lng: 77.5946});
    console.log('✅ Pest Detection Result:', pestResult.data);
    console.log('');

    // Test 4: Health Monitoring
    console.log('4. Testing Health Monitoring...');
    const healthData = {
      temperature: 30,
      humidity: 70,
      soilMoisture: 0.3,
      lightIntensity: 600
    };
    
    const healthResult = await MLService.monitorHealth(healthData, 'farm123');
    console.log('✅ Health Monitoring Result:');
    console.log('   Health Score:', healthResult.data.healthScore);
    console.log('   Risk Level:', healthResult.data.riskLevel);
    console.log('   Anomalies:', healthResult.data.anomalies.length);
    console.log('');

    // Test 5: Price Prediction
    console.log('5. Testing Price Prediction...');
    const priceResult = await MLService.predictPrice('Rice', [], {});
    console.log('✅ Price Prediction Result:');
    console.log('   Predictions:', priceResult.data.predictions.length, 'days');
    console.log('   Confidence:', priceResult.data.confidence);
    console.log('   Trend:', priceResult.data.trend);
    console.log('');

    // Test 6: Model Status
    console.log('6. Testing Model Status...');
    const statusResult = await MLService.getAllModelsStatus();
    console.log('✅ Model Status:', Object.keys(statusResult).length, 'models active');
    console.log('');

    console.log('🎉 All ML tests completed successfully!');
    console.log('✅ Local ML Service is working without external APIs');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLocalML();

