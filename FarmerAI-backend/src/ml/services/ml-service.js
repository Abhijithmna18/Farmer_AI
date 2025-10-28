// ML Service - Local machine learning operations (No external APIs)
const LocalMLService = require('./local-ml-service');

class MLService {
  constructor() {
    // Use local ML service
    this.localService = LocalMLService;
    
    // Local ML models and datasets
    this.models = {
      diseaseDetection: 'local-dataset-analysis',
      irrigationOptimization: 'rule-based-calculation',
      pestDetection: 'local-dataset-analysis',
      healthMonitoring: 'sensor-data-analysis',
      pricePrediction: 'time-series-analysis'
    };
  }

  // Disease Detection using local dataset
  async detectDisease(imagePath, userId) {
    return await this.localService.detectDisease(imagePath, userId);
  }

  // Irrigation Optimization using local calculations
  async optimizeIrrigation(farmData) {
    return await this.localService.optimizeIrrigation(farmData);
  }

  // Pest Detection using local dataset
  async detectPest(imagePath, farmId, location) {
    return await this.localService.detectPest(imagePath, farmId, location);
  }

  // Health Monitoring using sensor data
  async monitorHealth(sensorData, farmId) {
    return await this.localService.monitorHealth(sensorData, farmId);
  }

  // Price Prediction using local data
  async predictPrice(crop, historicalData, externalFactors) {
    return await this.localService.predictPrice(crop, historicalData, externalFactors);
  }

  // Yield Prediction using ANN Regression
  async predictYield(inputFeatures, sensorData) {
    return await this.localService.predictYield(inputFeatures, sensorData);
  }

  // Fertilizer Recommendation using Decision Tree Classification
  async recommendFertilizer(data) {
    return await this.localService.recommendFertilizer(data);
  }

  // Get model status
  async getModelStatus(modelName) {
    return {
      success: true,
      data: {
        model: modelName,
        status: 'active',
        type: 'local-dataset',
        accuracy: '75-90%'
      }
    };
  }

  // Get all models status
  async getAllModelsStatus() {
    const statuses = {};
    for (const [key, modelName] of Object.entries(this.models)) {
      statuses[key] = await this.getModelStatus(modelName);
    }
    return statuses;
  }

  // Validate ML service response
  validateResponse(response, expectedFields = []) {
    if (!response.success) {
      return false;
    }

    if (expectedFields.length > 0) {
      return expectedFields.every(field => response.data && response.data.hasOwnProperty(field));
    }

    return true;
  }

  // Log ML operations
  async logMLOperation(operation, model, userId, input, output, error = null) {
    try {
      const logEntry = {
        operation,
        model,
        userId,
        input: typeof input === 'object' ? JSON.stringify(input) : input,
        output: typeof output === 'object' ? JSON.stringify(output) : output,
        error: error ? error.message : null,
        timestamp: new Date()
      };

      // Log to console (in production, log to database)
      console.log('ML Operation Log:', logEntry);
      
    } catch (logError) {
      console.error('Failed to log ML operation:', logError.message);
    }
  }
}

module.exports = new MLService();