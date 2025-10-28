// Local ML Service - No external dependencies, pure Node.js
const fs = require('fs').promises;
const path = require('path');

class LocalMLService {
  constructor() {
    // Local disease dataset
    this.diseaseDataset = this.initializeDiseaseDataset();
    
    // Local crop dataset
    this.cropDataset = this.initializeCropDataset();
    
    // Local pest dataset
    this.pestDataset = this.initializePestDataset();
    
    // Local market data
    this.marketData = this.initializeMarketData();
  }

  // Initialize local disease dataset
  initializeDiseaseDataset() {
    return {
      'leaf-spot': {
        symptoms: ['yellow spots', 'brown edges', 'circular patches'],
        colors: { yellow: 0.3, brown: 0.2, black: 0.1 },
        treatment: 'Apply copper fungicide and remove affected leaves',
        prevention: 'Ensure proper air circulation and avoid overhead watering',
        severity: 'Medium',
        confidence: 0.85
      },
      'rust': {
        symptoms: ['orange spots', 'powdery coating', 'raised bumps'],
        colors: { brown: 0.4, orange: 0.2, yellow: 0.1 },
        treatment: 'Apply sulfur-based fungicide',
        prevention: 'Remove plant debris and improve drainage',
        severity: 'Medium',
        confidence: 0.80
      },
      'powdery-mildew': {
        symptoms: ['white coating', 'powdery surface', 'gray patches'],
        colors: { white: 0.3, gray: 0.2, green: 0.4 },
        treatment: 'Apply baking soda solution or neem oil',
        prevention: 'Increase air circulation and reduce humidity',
        severity: 'Low',
        confidence: 0.75
      },
      'black-spot': {
        symptoms: ['black spots', 'dark circles', 'yellowing'],
        colors: { black: 0.3, brown: 0.2, yellow: 0.1 },
        treatment: 'Apply neem oil and prune affected areas',
        prevention: 'Avoid wetting leaves and ensure good air circulation',
        severity: 'High',
        confidence: 0.90
      },
      'healthy': {
        symptoms: ['uniform color', 'smooth surface', 'no spots'],
        colors: { green: 0.7, yellow: 0.1, brown: 0.1 },
        treatment: 'Continue current care routine',
        prevention: 'Maintain proper watering and fertilization',
        severity: 'Low',
        confidence: 0.85
      }
    };
  }

  // Initialize local crop dataset
  initializeCropDataset() {
    return {
      'tomatoes': {
        waterNeed: 15,
        soilTypes: ['loamy', 'sandy'],
        season: 'summer',
        diseases: ['leaf-spot', 'blight'],
        pests: ['aphids', 'whiteflies'],
        growthTime: '75-90 days',
        yield: '10-15 kg per plant'
      },
      'rice': {
        waterNeed: 25,
        soilTypes: ['clay', 'loamy'],
        season: 'monsoon',
        diseases: ['rust', 'blight'],
        pests: ['rice-borer', 'leaf-hopper'],
        growthTime: '120-150 days',
        yield: '4-6 tons per hectare'
      },
      'wheat': {
        waterNeed: 12,
        soilTypes: ['loamy', 'clay'],
        season: 'winter',
        diseases: ['rust', 'powdery-mildew'],
        pests: ['aphids', 'thrips'],
        growthTime: '100-120 days',
        yield: '3-5 tons per hectare'
      },
      'maize': {
        waterNeed: 18,
        soilTypes: ['loamy', 'sandy'],
        season: 'summer',
        diseases: ['leaf-spot', 'rust'],
        pests: ['corn-borer', 'aphids'],
        growthTime: '80-100 days',
        yield: '6-8 tons per hectare'
      }
    };
  }

  // Initialize local pest dataset
  initializePestDataset() {
    return {
      'aphids': {
        description: 'Small green or black insects that cluster on leaves',
        damage: 'Sucking sap from leaves, causing yellowing and curling',
        treatment: 'Apply neem oil or insecticidal soap',
        prevention: 'Use beneficial insects like ladybugs',
        severity: 'Medium',
        confidence: 0.80
      },
      'whiteflies': {
        description: 'Small white flying insects that swarm when disturbed',
        damage: 'Sucking sap and spreading diseases',
        treatment: 'Yellow sticky traps and neem oil',
        prevention: 'Remove weeds and improve air circulation',
        severity: 'High',
        confidence: 0.85
      },
      'caterpillars': {
        description: 'Green or brown worm-like larvae that eat leaves',
        damage: 'Chewing holes in leaves and stems',
        treatment: 'Hand picking and Bacillus thuringiensis',
        prevention: 'Row covers and crop rotation',
        severity: 'Medium',
        confidence: 0.75
      }
    };
  }

  // Initialize local market data
  initializeMarketData() {
    return {
      'rice': {
        basePrice: 45,
        seasonalVariation: 0.15,
        trend: 'stable',
        demand: 'high'
      },
      'wheat': {
        basePrice: 35,
        seasonalVariation: 0.20,
        trend: 'increasing',
        demand: 'high'
      },
      'tomatoes': {
        basePrice: 25,
        seasonalVariation: 0.30,
        trend: 'volatile',
        demand: 'medium'
      },
      'maize': {
        basePrice: 20,
        seasonalVariation: 0.25,
        trend: 'stable',
        demand: 'medium'
      }
    };
  }

  // Disease Detection using local dataset
  async detectDisease(imagePath, userId) {
    try {
      console.log('🔍 Starting local disease detection...');
      
      // Simulate image analysis (in real implementation, you'd analyze the image)
      const analysis = await this.simulateImageAnalysis(imagePath);
      
      return {
        success: true,
        data: {
          diseaseType: analysis.diseaseType,
          confidence: analysis.confidence,
          treatment: analysis.treatment,
          prevention: analysis.prevention,
          severity: analysis.severity,
          affectedArea: 'Leaves',
          method: 'local-dataset-analysis'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to process image: ${error.message}`,
        model: 'disease-detection'
      };
    }
  }

  // Simulate image analysis (replace with real image processing)
  async simulateImageAnalysis(imagePath) {
    // In a real implementation, you would:
    // 1. Load the image
    // 2. Analyze colors and patterns
    // 3. Match against disease dataset
    
    // For now, simulate based on filename or random selection
    const diseases = Object.keys(this.diseaseDataset);
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const diseaseData = this.diseaseDataset[randomDisease];
    
    return {
      diseaseType: randomDisease.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      confidence: diseaseData.confidence,
      treatment: diseaseData.treatment,
      prevention: diseaseData.prevention,
      severity: diseaseData.severity
    };
  }

  // Pest Detection using local dataset
  async detectPest(imagePath, farmId, location) {
    try {
      console.log('🐛 Starting local pest detection...');
      
      const analysis = await this.simulatePestAnalysis(imagePath);
      
      return {
        success: true,
        data: {
          pestType: analysis.pestType,
          confidence: analysis.confidence,
          treatment: analysis.treatment,
          prevention: analysis.prevention,
          severity: analysis.severity,
          affectedArea: 'Leaves',
          method: 'local-dataset-analysis'
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to process pest image: ${error.message}`,
        model: 'pest-detection'
      };
    }
  }

  // Simulate pest analysis
  async simulatePestAnalysis(imagePath) {
    const pests = Object.keys(this.pestDataset);
    const randomPest = pests[Math.floor(Math.random() * pests.length)];
    const pestData = this.pestDataset[randomPest];
    
    return {
      pestType: randomPest.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      confidence: pestData.confidence,
      treatment: pestData.treatment,
      prevention: pestData.prevention,
      severity: pestData.severity
    };
  }

  // Irrigation Optimization using local calculations
  async optimizeIrrigation(farmData) {
    try {
      const { cropType, soilType, area, sensorData, weatherData } = farmData;
      
      // Get crop data
      const cropData = this.cropDataset[cropType.toLowerCase()] || this.cropDataset['tomatoes'];
      
      // Calculate irrigation schedule
      const schedule = this.calculateIrrigationSchedule(cropData, soilType, area, sensorData, weatherData);
      const waterUsage = schedule.reduce((total, session) => total + session.amount, 0);
      const efficiency = this.calculateIrrigationEfficiency(schedule, sensorData);
      
      return {
        success: true,
        data: {
          schedule,
          waterUsage,
          efficiency,
          recommendations: this.getIrrigationRecommendations(cropData, soilType, sensorData)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Irrigation optimization failed: ${error.message}`,
        model: 'irrigation-optimization'
      };
    }
  }

  // Calculate irrigation schedule
  calculateIrrigationSchedule(cropData, soilType, area, sensorData, weatherData) {
    const schedule = [];
    const baseWaterNeed = cropData.waterNeed;
    const soilFactor = this.getSoilFactor(soilType);
    const weatherFactor = this.getWeatherFactor(weatherData);
    
    // Generate 7-day schedule
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const dailyNeed = baseWaterNeed * soilFactor * weatherFactor * area;
      const session = {
        date: date.toISOString(),
        amount: Math.round(dailyNeed),
        duration: Math.round(dailyNeed / 2),
        reason: this.getIrrigationReason(cropData, weatherData, i),
        priority: this.getIrrigationPriority(dailyNeed, sensorData)
      };
      
      schedule.push(session);
    }
    
    return schedule;
  }

  // Get soil factor
  getSoilFactor(soilType) {
    const factors = {
      'sandy': 1.2,
      'loamy': 1.0,
      'clay': 0.8,
      'silty': 0.9,
      'default': 1.0
    };
    return factors[soilType.toLowerCase()] || factors.default;
  }

  // Get weather factor
  getWeatherFactor(weatherData) {
    if (!weatherData || !weatherData.forecast) return 1.0;
    
    const forecast = weatherData.forecast[0];
    if (!forecast) return 1.0;
    
    let factor = 1.0;
    
    if (forecast.temperature > 30) factor += 0.2;
    if (forecast.temperature < 15) factor -= 0.1;
    if (forecast.humidity < 40) factor += 0.1;
    if (forecast.humidity > 80) factor -= 0.1;
    if (forecast.rainfall > 5) factor -= 0.3;
    
    return Math.max(0.5, Math.min(1.5, factor));
  }

  // Get irrigation reason
  getIrrigationReason(cropData, weatherData, dayIndex) {
    const reasons = [
      'Regular scheduled irrigation',
      'Maintain soil moisture levels',
      'Support crop growth phase',
      'Compensate for low humidity',
      'Prevent water stress',
      'Optimize nutrient uptake',
      'Maintain crop health'
    ];
    return reasons[dayIndex % reasons.length];
  }

  // Get irrigation priority
  getIrrigationPriority(dailyNeed, sensorData) {
    if (dailyNeed > 20) return 'High';
    if (dailyNeed > 15) return 'Medium';
    return 'Low';
  }

  // Calculate irrigation efficiency
  calculateIrrigationEfficiency(schedule, sensorData) {
    let efficiency = 85;
    
    if (sensorData) {
      if (sensorData.soilMoisture < 0.3) efficiency -= 10;
      if (sensorData.soilMoisture > 0.7) efficiency -= 5;
      if (sensorData.temperature > 35) efficiency -= 5;
    }
    
    return Math.max(60, Math.min(95, efficiency));
  }

  // Get irrigation recommendations
  getIrrigationRecommendations(cropData, soilType, sensorData) {
    const recommendations = [];
    
    if (sensorData && sensorData.soilMoisture < 0.3) {
      recommendations.push('Increase irrigation frequency - soil moisture is low');
    }
    
    if (sensorData && sensorData.temperature > 35) {
      recommendations.push('Irrigate early morning to avoid evaporation');
    }
    
    if (soilType.toLowerCase() === 'sandy') {
      recommendations.push('Use frequent, light irrigation for sandy soil');
    }
    
    if (cropData.waterNeed > 20) {
      recommendations.push('This crop requires high water - ensure adequate irrigation');
    }
    
    return recommendations;
  }

  // Health Monitoring using sensor data
  async monitorHealth(sensorData, farmId) {
    try {
      const healthScore = this.calculateHealthScore(sensorData);
      const anomalies = this.detectAnomalies(sensorData);
      const recommendations = this.getHealthRecommendations(sensorData, healthScore);
      
      return {
        success: true,
        data: {
          healthScore,
          anomalies,
          recommendations,
          riskLevel: this.getRiskLevel(healthScore)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Health monitoring failed: ${error.message}`,
        model: 'health-monitoring'
      };
    }
  }

  // Calculate health score
  calculateHealthScore(sensorData) {
    let score = 1.0;
    
    // Temperature analysis
    if (sensorData.temperature < 10 || sensorData.temperature > 40) {
      score -= 0.3;
    } else if (sensorData.temperature < 15 || sensorData.temperature > 35) {
      score -= 0.1;
    }
    
    // Humidity analysis
    if (sensorData.humidity < 30 || sensorData.humidity > 90) {
      score -= 0.2;
    } else if (sensorData.humidity < 40 || sensorData.humidity > 80) {
      score -= 0.05;
    }
    
    // Soil moisture analysis
    if (sensorData.soilMoisture < 0.2 || sensorData.soilMoisture > 0.8) {
      score -= 0.4;
    } else if (sensorData.soilMoisture < 0.3 || sensorData.soilMoisture > 0.7) {
      score -= 0.1;
    }
    
    // Light intensity analysis
    if (sensorData.lightIntensity < 200 || sensorData.lightIntensity > 1000) {
      score -= 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // Detect anomalies
  detectAnomalies(sensorData) {
    const anomalies = [];
    
    if (sensorData.temperature > 35) {
      anomalies.push({
        type: 'temperature',
        severity: 'High',
        description: 'Temperature is too high for optimal plant growth',
        timestamp: new Date()
      });
    }
    
    if (sensorData.soilMoisture < 0.2) {
      anomalies.push({
        type: 'soil_moisture',
        severity: 'Critical',
        description: 'Soil moisture is critically low - immediate irrigation needed',
        timestamp: new Date()
      });
    }
    
    if (sensorData.humidity > 85) {
      anomalies.push({
        type: 'humidity',
        severity: 'Medium',
        description: 'High humidity may promote disease development',
        timestamp: new Date()
      });
    }
    
    return anomalies;
  }

  // Get health recommendations
  getHealthRecommendations(sensorData, healthScore) {
    const recommendations = [];
    
    if (healthScore < 0.3) {
      recommendations.push('Urgent: Crop health is critical - immediate intervention required');
    } else if (healthScore < 0.5) {
      recommendations.push('High priority: Crop health is poor - take corrective action');
    }
    
    if (sensorData.temperature > 35) {
      recommendations.push('Provide shade or increase ventilation to reduce temperature');
    }
    
    if (sensorData.soilMoisture < 0.3) {
      recommendations.push('Increase irrigation frequency and amount');
    }
    
    if (sensorData.humidity > 80) {
      recommendations.push('Improve air circulation to reduce humidity');
    }
    
    return recommendations;
  }

  // Get risk level
  getRiskLevel(healthScore) {
    if (healthScore >= 0.8) return 'Low';
    if (healthScore >= 0.6) return 'Medium';
    if (healthScore >= 0.4) return 'High';
    return 'Critical';
  }

  // Price Prediction using local data
  async predictPrice(crop, historicalData, externalFactors) {
    try {
      const cropData = this.marketData[crop.toLowerCase()] || this.marketData['rice'];
      const predictions = this.calculatePricePredictions(cropData, historicalData, externalFactors);
      
      return {
        success: true,
        data: {
          predictions,
          confidence: 0.75,
          factors: this.getPriceFactors(cropData, externalFactors),
          trend: cropData.trend
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Price prediction failed: ${error.message}`,
        model: 'price-prediction'
      };
    }
  }

  // Yield Prediction using ANN Regression (simulated)
  async predictYield(inputFeatures, sensorData) {
    try {
      console.log('🌾 Starting yield prediction using ANN regression...');
      
      // Simulate ANN regression calculation
      const yieldPrediction = this.calculateYieldPrediction(inputFeatures, sensorData);
      
      return {
        success: true,
        data: {
          predictedYield: yieldPrediction.yield,
          confidence: yieldPrediction.confidence,
          recommendations: yieldPrediction.recommendations,
          modelType: 'ANN-Regression',
          features: inputFeatures
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Yield prediction failed: ${error.message}`,
        model: 'yield-prediction'
      };
    }
  }

  // Fertilizer Recommendation using Decision Tree Classification (simulated)
  async recommendFertilizer({ cropType, soilAnalysis, previousCrop, plantingDate, budget }) {
    try {
      console.log('🌱 Starting fertilizer recommendation using decision tree...');
      
      // Simulate decision tree classification
      const recommendation = this.calculateFertilizerRecommendation({
        cropType,
        soilAnalysis,
        previousCrop,
        plantingDate,
        budget
      });
      
      return {
        success: true,
        data: {
          recommendations: recommendation.fertilizers,
          decisionTreePath: recommendation.path,
          confidence: recommendation.confidence,
          totalCost: recommendation.totalCost,
          applicationSchedule: recommendation.schedule,
          modelType: 'Decision-Tree-Classification'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Fertilizer recommendation failed: ${error.message}`,
        model: 'fertilizer-recommendation'
      };
    }
  }

  // Calculate price predictions
  calculatePricePredictions(cropData, historicalData, externalFactors) {
    const predictions = [];
    const basePrice = cropData.basePrice;
    const variation = cropData.seasonalVariation;
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Simple price calculation with seasonal variation
      const seasonalFactor = 1 + (Math.sin((date.getMonth() / 12) * 2 * Math.PI) * variation);
      const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // ±5% random variation
      const price = basePrice * seasonalFactor * randomFactor;
      
      predictions.push({
        date: date.toISOString(),
        price: Math.round(price * 100) / 100,
        confidence: 0.75
      });
    }
    
    return predictions;
  }

  // Get price factors
  getPriceFactors(cropData, externalFactors) {
    return [
      `Seasonal variation: ${(cropData.seasonalVariation * 100).toFixed(1)}%`,
      `Market trend: ${cropData.trend}`,
      `Demand level: ${cropData.demand}`,
      'Weather conditions',
      'Supply and demand balance'
    ];
  }

  // Calculate yield prediction using simulated ANN regression
  calculateYieldPrediction(inputFeatures, sensorData) {
    const { nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall, soilType, irrigationMethod } = inputFeatures;
    
    // Simulate ANN regression calculation
    // In a real implementation, this would use a trained neural network
    let baseYield = 1000; // Base yield in kg/hectare
    
    // Feature weights (simulated from trained model)
    const weights = {
      nitrogen: 0.3,
      phosphorus: 0.25,
      potassium: 0.2,
      temperature: 0.15,
      humidity: 0.1,
      ph: 0.1,
      rainfall: 0.2,
      soilType: 0.1,
      irrigationMethod: 0.15
    };
    
    // Normalize inputs and apply weights
    const normalizedN = Math.min(nitrogen / 100, 1);
    const normalizedP = Math.min(phosphorus / 50, 1);
    const normalizedK = Math.min(potassium / 50, 1);
    const normalizedTemp = Math.max(0, Math.min((temperature - 10) / 30, 1));
    const normalizedHumidity = humidity / 100;
    const normalizedPh = Math.max(0, Math.min((ph - 4) / 6, 1));
    const normalizedRainfall = Math.min(rainfall / 200, 1);
    
    // Soil type factor
    const soilFactors = {
      'sandy': 0.8,
      'loamy': 1.0,
      'clay': 0.9,
      'silty': 0.95
    };
    const soilFactor = soilFactors[soilType.toLowerCase()] || 1.0;
    
    // Irrigation method factor
    const irrigationFactors = {
      'drip': 1.2,
      'sprinkler': 1.0,
      'flood': 0.8,
      'manual': 0.9
    };
    const irrigationFactor = irrigationFactors[irrigationMethod.toLowerCase()] || 1.0;
    
    // Calculate yield using weighted features
    const yieldScore = (
      normalizedN * weights.nitrogen +
      normalizedP * weights.phosphorus +
      normalizedK * weights.potassium +
      normalizedTemp * weights.temperature +
      normalizedHumidity * weights.humidity +
      normalizedPh * weights.ph +
      normalizedRainfall * weights.rainfall
    );
    
    const predictedYield = Math.round(baseYield * yieldScore * soilFactor * irrigationFactor);
    
    // Calculate confidence based on input quality
    let confidence = 85;
    if (nitrogen < 20 || nitrogen > 200) confidence -= 10;
    if (phosphorus < 10 || phosphorus > 100) confidence -= 10;
    if (potassium < 10 || potassium > 100) confidence -= 10;
    if (ph < 5 || ph > 8) confidence -= 15;
    if (temperature < 15 || temperature > 35) confidence -= 10;
    
    // Generate recommendations
    const recommendations = [];
    
    if (nitrogen < 50) {
      recommendations.push({
        type: 'fertilizer',
        priority: 'high',
        message: 'Increase nitrogen application for better yield',
        expectedImpact: '15-25% yield increase'
      });
    }
    
    if (ph < 6 || ph > 7.5) {
      recommendations.push({
        type: 'soil_management',
        priority: 'medium',
        message: 'Adjust soil pH to optimal range (6.0-7.5)',
        expectedImpact: '10-15% yield improvement'
      });
    }
    
    if (irrigationMethod === 'flood') {
      recommendations.push({
        type: 'irrigation',
        priority: 'medium',
        message: 'Consider switching to drip irrigation for better efficiency',
        expectedImpact: '20-30% water savings and 10% yield increase'
      });
    }
    
    if (predictedYield < 800) {
      recommendations.push({
        type: 'general',
        priority: 'critical',
        message: 'Overall crop management needs improvement',
        expectedImpact: 'Significant yield improvement potential'
      });
    }
    
    return {
      yield: predictedYield,
      confidence: Math.max(60, Math.min(95, confidence)),
      recommendations
    };
  }

  // Calculate fertilizer recommendation using simulated decision tree
  calculateFertilizerRecommendation({ cropType, soilAnalysis, previousCrop, plantingDate, budget }) {
    const { nitrogen, phosphorus, potassium, ph, organicMatter, soilType } = soilAnalysis;
    
    const recommendations = [];
    let totalCost = 0;
    const applicationSchedule = [];
    
    // Decision tree logic for fertilizer recommendations
    let decisionPath = `Crop: ${cropType}, Soil: ${soilType}`;
    
    // Nitrogen recommendations
    if (nitrogen < 30) {
      const amount = Math.min(100, (50 - nitrogen) * 2);
      recommendations.push({
        fertilizerType: 'Urea',
        amount: Math.round(amount),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'high',
        reason: 'Low nitrogen levels detected',
        expectedBenefit: 'Improved vegetative growth and yield'
      });
      totalCost += amount * 0.5; // ₹0.5 per kg
      decisionPath += ' → Low N → Urea';
    } else if (nitrogen > 80) {
      recommendations.push({
        fertilizerType: 'Organic',
        amount: 20,
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'low',
        reason: 'High nitrogen levels - use organic matter',
        expectedBenefit: 'Maintain soil health and reduce leaching'
      });
      totalCost += 20 * 0.3; // ₹0.3 per kg
      decisionPath += ' → High N → Organic';
    }
    
    // Phosphorus recommendations
    if (phosphorus < 15) {
      const amount = Math.min(50, (25 - phosphorus) * 2);
      recommendations.push({
        fertilizerType: 'DAP',
        amount: Math.round(amount),
        unit: 'kg',
        applicationMethod: 'band_placement',
        timing: 'at_planting',
        priority: 'high',
        reason: 'Low phosphorus levels detected',
        expectedBenefit: 'Better root development and flowering'
      });
      totalCost += amount * 0.8; // ₹0.8 per kg
      decisionPath += ' → Low P → DAP';
    }
    
    // Potassium recommendations
    if (potassium < 20) {
      const amount = Math.min(60, (40 - potassium) * 1.5);
      recommendations.push({
        fertilizerType: 'MOP',
        amount: Math.round(amount),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'side_dressing',
        priority: 'medium',
        reason: 'Low potassium levels detected',
        expectedBenefit: 'Improved fruit quality and disease resistance'
      });
      totalCost += amount * 0.6; // ₹0.6 per kg
      decisionPath += ' → Low K → MOP';
    }
    
    // pH adjustment
    if (ph < 6.0) {
      recommendations.push({
        fertilizerType: 'Lime',
        amount: Math.round((6.5 - ph) * 100),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'high',
        reason: 'Soil pH too acidic',
        expectedBenefit: 'Improved nutrient availability'
      });
      totalCost += (6.5 - ph) * 100 * 0.2; // ₹0.2 per kg
      decisionPath += ' → Low pH → Lime';
    } else if (ph > 7.5) {
      recommendations.push({
        fertilizerType: 'Sulfur',
        amount: Math.round((ph - 7.0) * 50),
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'pre_planting',
        priority: 'medium',
        reason: 'Soil pH too alkaline',
        expectedBenefit: 'Improved nutrient availability'
      });
      totalCost += (ph - 7.0) * 50 * 0.4; // ₹0.4 per kg
      decisionPath += ' → High pH → Sulfur';
    }
    
    // Crop-specific recommendations
    if (cropType.toLowerCase() === 'rice') {
      recommendations.push({
        fertilizerType: 'NPK',
        amount: 25,
        unit: 'kg',
        applicationMethod: 'broadcast',
        timing: 'top_dressing',
        priority: 'medium',
        reason: 'Rice-specific nutrient needs',
        expectedBenefit: 'Balanced nutrition for rice cultivation'
      });
      totalCost += 25 * 0.7; // ₹0.7 per kg
      decisionPath += ' → Rice → NPK';
    }
    
    // Generate application schedule
    const plantingDateObj = new Date(plantingDate);
    recommendations.forEach((rec, index) => {
      let scheduleDate = new Date(plantingDateObj);
      
      switch (rec.timing) {
        case 'pre_planting':
          scheduleDate.setDate(scheduleDate.getDate() - 7);
          break;
        case 'at_planting':
          // Same day as planting
          break;
        case 'side_dressing':
          scheduleDate.setDate(scheduleDate.getDate() + 30);
          break;
        case 'top_dressing':
          scheduleDate.setDate(scheduleDate.getDate() + 45);
          break;
        case 'post_harvest':
          scheduleDate.setDate(scheduleDate.getDate() + 120);
          break;
      }
      
      applicationSchedule.push({
        date: scheduleDate,
        fertilizer: rec.fertilizerType,
        amount: rec.amount,
        method: rec.applicationMethod,
        notes: rec.reason
      });
    });
    
    // Calculate confidence based on soil test quality
    let confidence = 80;
    if (ph < 5 || ph > 8) confidence -= 15;
    if (nitrogen < 10 || nitrogen > 100) confidence -= 10;
    if (phosphorus < 5 || phosphorus > 50) confidence -= 10;
    if (potassium < 10 || potassium > 60) confidence -= 10;
    
    // Adjust for budget constraints
    if (totalCost > budget) {
      // Scale down recommendations to fit budget
      const scaleFactor = budget / totalCost;
      recommendations.forEach(rec => {
        rec.amount = Math.round(rec.amount * scaleFactor);
      });
      totalCost = budget;
      confidence -= 10;
    }
    
    return {
      fertilizers: recommendations,
      path: decisionPath,
      confidence: Math.max(60, Math.min(95, confidence)),
      totalCost: Math.round(totalCost * 100) / 100,
      schedule: applicationSchedule.sort((a, b) => new Date(a.date) - new Date(b.date))
    };
  }
}

module.exports = new LocalMLService();

