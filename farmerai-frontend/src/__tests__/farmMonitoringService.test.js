import * as farmMonitoringService from '../services/farmMonitoring.service';
import apiClient from '../services/apiClient';

// Mock apiClient
jest.mock('../services/apiClient');

describe('farmMonitoringService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('fetchAndStoreSensorData', () => {
    it('should fetch and store sensor data successfully', async () => {
      const mockResponse = { data: { success: true, message: 'Data fetched successfully' } };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.fetchAndStoreSensorData();

      expect(apiClient.post).toHaveBeenCalledWith('/farm-monitoring/fetch');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors when fetching sensor data', async () => {
      const mockError = new Error('Network error');
      apiClient.post.mockRejectedValue(mockError);

      await expect(farmMonitoringService.fetchAndStoreSensorData()).rejects.toThrow('Network error');
    });
  });

  describe('getLatestReading', () => {
    it('should get the latest sensor reading', async () => {
      const mockResponse = { data: { success: true, data: { temperature: 25.5 } } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getLatestReading();

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/latest');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getHistoricalData', () => {
    it('should get historical sensor data with default parameters', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getHistoricalData();

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/history', {
        params: { hours: 24, limit: 100 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get historical sensor data with custom parameters', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getHistoricalData(48, 200);

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/history', {
        params: { hours: 48, limit: 200 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSensorStats', () => {
    it('should get sensor statistics', async () => {
      const mockResponse = { data: { success: true, data: { temperature: {} } } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getSensorStats(48);

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/stats', {
        params: { hours: 48 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('exportSensorDataCSV', () => {
    it('should export sensor data as CSV', async () => {
      // Mock blob response
      const mockBlob = new Blob(['test,csv,data'], { type: 'text/csv' });
      const mockResponse = { data: mockBlob };
      apiClient.get.mockResolvedValue(mockResponse);

      // Mock URL.createObjectURL
      const mockUrl = 'blob:test';
      global.URL.createObjectURL = jest.fn(() => mockUrl);
      global.URL.revokeObjectURL = jest.fn();

      // Mock document.createElement and appendChild
      const mockLink = { setAttribute: jest.fn(), click: jest.fn() };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const result = await farmMonitoringService.exportSensorDataCSV(24);

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/export', {
        params: { hours: 24 },
        responseType: 'blob',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('exportSensorDataPDF', () => {
    it('should export sensor data as PDF', async () => {
      // Mock jsPDF and autoTable
      const mockSave = jest.fn();
      const mockJsPDF = jest.fn(() => ({
        save: mockSave,
        setFontSize: jest.fn(),
        text: jest.fn(),
        lastAutoTable: { finalY: 100 },
      }));
      
      // Mock the dynamic imports
      jest.mock('jspdf', () => ({ jsPDF: mockJsPDF }));
      jest.mock('jspdf-autotable', () => ({ default: jest.fn() }));

      // Mock service responses
      farmMonitoringService.getHistoricalData = jest.fn().mockResolvedValue({
        success: true,
        data: [{ timestamp: new Date(), temperature: 25.5, humidity: 60, soilMoisture: 750 }],
      });
      
      farmMonitoringService.getSensorStats = jest.fn().mockResolvedValue({
        success: true,
        data: { temperature: { min: 20, max: 30, avg: 25 } },
      });

      const result = await farmMonitoringService.exportSensorDataPDF(24);

      expect(result.success).toBe(true);
    });
  });

  describe('getPredictiveAnalytics', () => {
    it('should get predictive analytics', async () => {
      const mockResponse = { data: { success: true, data: { temperature: { trend: 0.1 } } } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getPredictiveAnalytics(48);

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/analytics', {
        params: { hours: 48 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAlerts', () => {
    it('should get alert conditions', async () => {
      const mockResponse = { data: { success: true, data: { alerts: [] } } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getAlerts();

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/alerts');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createCustomAlert', () => {
    it('should create a custom alert', async () => {
      const alertData = {
        type: 'temperature',
        threshold: 30,
        condition: 'above',
        severity: 'high',
        message: 'Temperature too high',
      };
      
      const mockResponse = { data: { success: true, data: alertData } };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.createCustomAlert(alertData);

      expect(apiClient.post).toHaveBeenCalledWith('/farm-monitoring/alerts', alertData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCustomAlerts', () => {
    it('should get all custom alerts', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await farmMonitoringService.getCustomAlerts();

      expect(apiClient.get).toHaveBeenCalledWith('/farm-monitoring/alerts/custom');
      expect(result).toEqual(mockResponse.data);
    });
  });
});