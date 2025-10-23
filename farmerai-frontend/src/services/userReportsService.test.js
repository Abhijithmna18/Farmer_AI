import { fetchUserBookings, fetchSoilHistory, fetchCropsReport } from './userReportsService';

// Mock the apiClient
jest.mock('./apiClient', () => ({
  get: jest.fn()
}));

import apiClient from './apiClient';

describe('userReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserBookings', () => {
    it('should fetch user bookings with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: []
        }
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const filters = { dateFrom: '2023-01-01', dateTo: '2023-12-31', status: 'completed' };
      const result = await fetchUserBookings(filters);
      
      expect(apiClient.get).toHaveBeenCalledWith('/warehouse-bookings/my-bookings?dateFrom=2023-01-01&dateTo=2023-12-31&status=completed');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchSoilHistory', () => {
    it('should fetch soil history with default months', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: []
        }
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const result = await fetchSoilHistory();
      
      expect(apiClient.get).toHaveBeenCalledWith('/reports/soil?months=6');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchCropsReport', () => {
    it('should fetch crops report', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: []
        }
      };
      
      apiClient.get.mockResolvedValue(mockResponse);
      
      const result = await fetchCropsReport();
      
      expect(apiClient.get).toHaveBeenCalledWith('/reports/crops');
      expect(result).toEqual(mockResponse.data);
    });
  });
});