// Weather API service for fetching real-time weather data
const axios = require('axios');
const logger = require('../utils/logger');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get current weather for a location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Object} Weather data
   */
  async getCurrentWeather(latitude, longitude) {
    try {
      const cacheKey = `current_${latitude}_${longitude}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        logger.info('Returning cached weather data');
        return cached;
      }

      if (!this.apiKey) {
        logger.warn('OpenWeather API key not configured, returning mock data');
        return this.getMockWeatherData();
      }

      const url = `${this.baseUrl}/weather`;
      const params = {
        lat: latitude,
        lon: longitude,
        appid: this.apiKey,
        units: 'metric'
      };

      logger.info(`Fetching weather data for coordinates: ${latitude}, ${longitude}`);
      const response = await axios.get(url, { params });
      
      const weatherData = {
        temperature: Math.round(response.data.main.temp),
        humidity: response.data.main.humidity,
        precipitation: response.data.rain?.['1h'] || 0,
        windSpeed: response.data.wind.speed,
        condition: response.data.weather[0].main.toLowerCase(),
        description: response.data.weather[0].description,
        recordedAt: new Date(),
        source: 'openweather-api',
        location: {
          latitude,
          longitude,
          city: response.data.name,
          country: response.data.sys.country
        }
      };

      this.setCachedData(cacheKey, weatherData);
      logger.info('Weather data fetched successfully');
      return weatherData;
    } catch (error) {
      logger.error('Error fetching weather data:', error.message);
      return this.getMockWeatherData();
    }
  }

  /**
   * Get weather forecast for a location
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {number} days - Number of days to forecast (1-5)
   * @returns {Array} Forecast data
   */
  async getWeatherForecast(latitude, longitude, days = 5) {
    try {
      const cacheKey = `forecast_${latitude}_${longitude}_${days}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        logger.info('Returning cached forecast data');
        return cached;
      }

      if (!this.apiKey) {
        logger.warn('OpenWeather API key not configured, returning mock forecast');
        return this.getMockForecastData(days);
      }

      const url = `${this.baseUrl}/forecast`;
      const params = {
        lat: latitude,
        lon: longitude,
        appid: this.apiKey,
        units: 'metric',
        cnt: days * 8 // 8 forecasts per day (every 3 hours)
      };

      logger.info(`Fetching ${days}-day forecast for coordinates: ${latitude}, ${longitude}`);
      const response = await axios.get(url, { params });
      
      const forecastData = response.data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        humidity: item.main.humidity,
        precipitation: item.rain?.['3h'] || 0,
        windSpeed: item.wind.speed,
        condition: item.weather[0].main.toLowerCase(),
        description: item.weather[0].description
      }));

      this.setCachedData(cacheKey, forecastData);
      logger.info('Forecast data fetched successfully');
      return forecastData;
    } catch (error) {
      logger.error('Error fetching forecast data:', error.message);
      return this.getMockForecastData(days);
    }
  }

  /**
   * Get weather suggestions for farming activities
   * @param {Object} weatherData - Current weather data
   * @param {string} activity - Farming activity type
   * @returns {Object} Weather-based suggestions
   */
  getWeatherSuggestions(weatherData, activity) {
    const suggestions = {
      canProceed: true,
      warnings: [],
      recommendations: [],
      riskLevel: 'low'
    };

    switch (activity) {
      case 'irrigation':
        if (weatherData.precipitation > 5) {
          suggestions.canProceed = false;
          suggestions.warnings.push('Heavy rain forecasted - postpone irrigation');
          suggestions.recommendations.push('Wait for rain to pass before irrigating');
          suggestions.riskLevel = 'high';
        } else if (weatherData.precipitation > 2) {
          suggestions.warnings.push('Light rain expected - reduce irrigation amount');
          suggestions.riskLevel = 'medium';
        }
        break;

      case 'fertilization':
        if (weatherData.windSpeed > 15) {
          suggestions.warnings.push('High winds - avoid liquid fertilizer application');
          suggestions.recommendations.push('Use granular fertilizer or wait for calmer conditions');
          suggestions.riskLevel = 'medium';
        }
        if (weatherData.precipitation > 3) {
          suggestions.warnings.push('Rain expected - fertilizer may be washed away');
          suggestions.recommendations.push('Apply fertilizer before rain or use slow-release formula');
          suggestions.riskLevel = 'medium';
        }
        break;

      case 'harvest':
        if (weatherData.precipitation > 2) {
          suggestions.warnings.push('Wet conditions - harvest quality may be affected');
          suggestions.recommendations.push('Wait for dry conditions or use protective measures');
          suggestions.riskLevel = 'medium';
        }
        if (weatherData.humidity > 80) {
          suggestions.warnings.push('High humidity - risk of mold and spoilage');
          suggestions.recommendations.push('Ensure proper ventilation during storage');
          suggestions.riskLevel = 'medium';
        }
        break;

      case 'sowing':
        if (weatherData.temperature < 10) {
          suggestions.warnings.push('Low temperature - seeds may not germinate properly');
          suggestions.recommendations.push('Wait for warmer conditions or use cold-resistant varieties');
          suggestions.riskLevel = 'high';
        }
        if (weatherData.precipitation > 10) {
          suggestions.warnings.push('Heavy rain - seeds may be washed away');
          suggestions.recommendations.push('Wait for rain to pass or use protective covering');
          suggestions.riskLevel = 'high';
        }
        break;

      default:
        suggestions.recommendations.push('Check weather conditions before proceeding');
    }

    return suggestions;
  }

  /**
   * Get optimal weather window for an activity
   * @param {Array} forecastData - Weather forecast data
   * @param {string} activity - Farming activity type
   * @returns {Object} Optimal time window
   */
  getOptimalWeatherWindow(forecastData, activity) {
    const optimalConditions = {
      irrigation: { maxPrecipitation: 1, maxWindSpeed: 10, minTemp: 5, maxTemp: 35 },
      fertilization: { maxPrecipitation: 2, maxWindSpeed: 15, minTemp: 10, maxTemp: 30 },
      harvest: { maxPrecipitation: 1, maxWindSpeed: 20, minTemp: 5, maxTemp: 40 },
      sowing: { maxPrecipitation: 3, maxWindSpeed: 15, minTemp: 10, maxTemp: 35 }
    };

    const conditions = optimalConditions[activity] || optimalConditions.sowing;
    const suitableWindows = [];

    forecastData.forEach((forecast, index) => {
      const isSuitable = 
        forecast.precipitation <= conditions.maxPrecipitation &&
        forecast.windSpeed <= conditions.maxWindSpeed &&
        forecast.temperature >= conditions.minTemp &&
        forecast.temperature <= conditions.maxTemp;

      if (isSuitable) {
        suitableWindows.push({
          date: forecast.date,
          score: this.calculateWeatherScore(forecast, conditions),
          forecast
        });
      }
    });

    // Sort by score (higher is better) and return top 3 windows
    suitableWindows.sort((a, b) => b.score - a.score);
    return suitableWindows.slice(0, 3);
  }

  /**
   * Calculate weather suitability score
   * @param {Object} forecast - Weather forecast data
   * @param {Object} conditions - Optimal conditions
   * @returns {number} Score from 0-100
   */
  calculateWeatherScore(forecast, conditions) {
    let score = 100;

    // Penalize for precipitation
    if (forecast.precipitation > 0) {
      score -= forecast.precipitation * 10;
    }

    // Penalize for high winds
    if (forecast.windSpeed > conditions.maxWindSpeed * 0.5) {
      score -= (forecast.windSpeed - conditions.maxWindSpeed * 0.5) * 2;
    }

    // Penalize for extreme temperatures
    const tempRange = conditions.maxTemp - conditions.minTemp;
    const optimalTemp = (conditions.maxTemp + conditions.minTemp) / 2;
    const tempDeviation = Math.abs(forecast.temperature - optimalTemp);
    score -= (tempDeviation / tempRange) * 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Cache management methods
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Mock data for development/testing
   */
  getMockWeatherData() {
    return {
      temperature: 22,
      humidity: 65,
      precipitation: 0,
      windSpeed: 8,
      condition: 'clear',
      description: 'clear sky',
      recordedAt: new Date(),
      source: 'mock-data',
      location: {
        latitude: 0,
        longitude: 0,
        city: 'Mock City',
        country: 'Mock Country'
      }
    };
  }

  getMockForecastData(days) {
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date,
        temperature: 20 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        precipitation: Math.random() * 5,
        windSpeed: 5 + Math.random() * 10,
        condition: ['clear', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
        description: 'mock forecast data'
      });
    }
    return forecast;
  }
}

module.exports = new WeatherService();


