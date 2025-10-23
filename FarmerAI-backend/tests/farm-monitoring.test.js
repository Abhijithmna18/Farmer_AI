const request = require('supertest');
const app = require('../server');
const SensorData = require('../src/models/SensorData');
const mongoose = require('mongoose');

// Mock data
const mockSensorData = {
  temperature: 25.5,
  humidity: 60.2,
  soilMoisture: 750,
  timestamp: new Date(),
  source: 'ESP32'
};

describe('Farm Monitoring API', () => {
  let authToken;
  let sensorDataId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farmerai_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await SensorData.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/farm-monitoring/add', () => {
    it('should add sensor data successfully', async () => {
      const response = await request(app)
        .post('/api/farm-monitoring/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockSensorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.temperature).toBe(mockSensorData.temperature);
      expect(response.body.data.humidity).toBe(mockSensorData.humidity);
      expect(response.body.data.soilMoisture).toBe(mockSensorData.soilMoisture);
      
      sensorDataId = response.body.data._id;
    });

    it('should reject invalid sensor data', async () => {
      const invalidData = {
        temperature: 150, // Out of range
        humidity: 60.2,
        soilMoisture: 750
      };

      const response = await request(app)
        .post('/api/farm-monitoring/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Temperature value out of valid range');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        temperature: 25.5
        // Missing humidity and soilMoisture
      };

      const response = await request(app)
        .post('/api/farm-monitoring/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Temperature, humidity, and soilMoisture are required');
    });
  });

  describe('GET /api/farm-monitoring/latest', () => {
    it('should get the latest sensor reading', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/latest')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('temperature');
      expect(response.body.data).toHaveProperty('humidity');
      expect(response.body.data).toHaveProperty('soilMoisture');
      expect(response.body.data).toHaveProperty('statusMessage');
    });

    it('should return 404 when no data is available', async () => {
      // Clear all data first
      await SensorData.deleteMany({});

      const response = await request(app)
        .get('/api/farm-monitoring/latest')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No sensor data available');
    });
  });

  describe('GET /api/farm-monitoring/history', () => {
    beforeAll(async () => {
      // Add some test data
      const testData = [];
      for (let i = 0; i < 5; i++) {
        testData.push({
          temperature: 20 + i,
          humidity: 50 + i,
          soilMoisture: 500 + i * 50,
          timestamp: new Date(Date.now() - i * 3600000), // 1 hour apart
          source: 'ESP32'
        });
      }
      await SensorData.insertMany(testData);
    });

    it('should get historical sensor data', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24, limit: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should respect the hours parameter', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 1 }) // Only last hour
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should have fewer data points
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should respect invalid hours parameter', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 200 }) // Invalid - too large
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Hours must be between 1 and 168');
    });
  });

  describe('GET /api/farm-monitoring/stats', () => {
    it('should calculate sensor statistics', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('temperature');
      expect(response.body.data).toHaveProperty('humidity');
      expect(response.body.data).toHaveProperty('soilMoisture');
      expect(response.body.data).toHaveProperty('dataPoints');
      
      // Check that stats have min, max, avg, current
      expect(response.body.data.temperature).toHaveProperty('min');
      expect(response.body.data.temperature).toHaveProperty('max');
      expect(response.body.data.temperature).toHaveProperty('avg');
      expect(response.body.data.temperature).toHaveProperty('current');
    });

    it('should return 404 when no data is available for stats', async () => {
      // Clear all data first
      await SensorData.deleteMany({});

      const response = await request(app)
        .get('/api/farm-monitoring/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No sensor data available for the specified period');
    });
  });

  describe('GET /api/farm-monitoring/analytics', () => {
    beforeAll(async () => {
      // Add some test data with trends
      const testData = [];
      for (let i = 0; i < 10; i++) {
        testData.push({
          temperature: 20 + i * 0.5, // Increasing trend
          humidity: 60 - i * 0.2,    // Decreasing trend
          soilMoisture: 600 + i * 5, // Increasing trend
          timestamp: new Date(Date.now() - (9 - i) * 3600000), // 1 hour apart
          source: 'ESP32'
        });
      }
      await SensorData.insertMany(testData);
    });

    it('should perform predictive analytics', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ hours: 24 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('temperature');
      expect(response.body.data).toHaveProperty('humidity');
      expect(response.body.data).toHaveProperty('soilMoisture');
      expect(response.body.data).toHaveProperty('recommendations');
      
      // Check that analytics have trend, movingAverage, stdDev
      expect(response.body.data.temperature).toHaveProperty('trend');
      expect(response.body.data.temperature).toHaveProperty('movingAverage');
      expect(response.body.data.temperature).toHaveProperty('stdDev');
    });
  });

  describe('GET /api/farm-monitoring/alerts', () => {
    it('should get alert conditions', async () => {
      // Add some data that will trigger alerts
      await SensorData.deleteMany({});
      await SensorData.create({
        temperature: 45, // High temperature
        humidity: 95,    // High humidity
        soilMoisture: 250, // Low soil moisture
        timestamp: new Date(),
        source: 'ESP32'
      });

      const response = await request(app)
        .get('/api/farm-monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.alerts)).toBe(true);
      expect(response.body.data.alerts.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/farm-monitoring/alerts', () => {
    it('should create a custom alert', async () => {
      const alertData = {
        type: 'temperature',
        threshold: 30,
        condition: 'above',
        severity: 'high',
        message: 'Temperature is too high',
        recommendation: 'Provide shade'
      };

      const response = await request(app)
        .post('/api/farm-monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(alertData.type);
      expect(response.body.data.threshold).toBe(alertData.threshold);
      expect(response.body.data.message).toBe(alertData.message);
    });

    it('should reject invalid alert data', async () => {
      const invalidAlertData = {
        type: 'temperature',
        threshold: 30,
        condition: 'invalid', // Invalid condition
        severity: 'high',
        message: 'Temperature is too high'
      };

      const response = await request(app)
        .post('/api/farm-monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAlertData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Condition must be one of');
    });
  });

  describe('GET /api/farm-monitoring/alerts/custom', () => {
    it('should get custom alerts', async () => {
      const response = await request(app)
        .get('/api/farm-monitoring/alerts/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/farm-monitoring/cleanup', () => {
    it('should clean up old sensor data', async () => {
      // Add some old data
      await SensorData.create({
        temperature: 25,
        humidity: 60,
        soilMoisture: 700,
        timestamp: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days old
        source: 'ESP32'
      });

      const response = await request(app)
        .delete('/api/farm-monitoring/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedCount).toBeGreaterThanOrEqual(1);
    });
  });
});