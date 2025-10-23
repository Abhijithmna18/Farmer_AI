import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FarmMonitoring from '../pages/FarmMonitoring';
import * as farmMonitoringService from '../services/farmMonitoring.service';

// Mock the farm monitoring service
jest.mock('../services/farmMonitoring.service');

// Mock the AuthContext
const mockAuthContext = {
  refreshToken: jest.fn(),
};

jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthContext: {
    Provider: ({ children }) => children,
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test');

describe('FarmMonitoring', () => {
  const mockLatestData = {
    success: true,
    data: {
      temperature: 25.5,
      humidity: 60.2,
      soilMoisture: 750,
      timestamp: new Date().toISOString(),
      statusMessage: 'Soil Moisture Normal',
      needsIrrigation: false,
    },
  };

  const mockHistoricalData = {
    success: true,
    data: [
      {
        timestamp: new Date().toISOString(),
        temperature: 25.5,
        humidity: 60.2,
        soilMoisture: 750,
      },
    ],
  };

  const mockStats = {
    success: true,
    data: {
      temperature: { min: 20, max: 30, avg: 25, current: 25.5 },
      humidity: { min: 50, max: 70, avg: 60, current: 60.2 },
      soilMoisture: { min: 500, max: 800, avg: 650, current: 750 },
      dataPoints: 10,
      period: '24 hours',
    },
  };

  const mockAnalytics = {
    success: true,
    data: {
      temperature: { trend: 0.1, movingAverage: 25.2, stdDev: 2.5, min: 20, max: 30, current: 25.5 },
      humidity: { trend: -0.2, movingAverage: 59.8, stdDev: 3.0, min: 50, max: 70, current: 60.2 },
      soilMoisture: { trend: 0.5, movingAverage: 650, stdDev: 50, min: 500, max: 800, current: 750 },
      irrigationNeeded: false,
      dataPoints: 10,
      period: '24 hours',
      recommendations: ['Conditions are stable'],
    },
  };

  const mockAlerts = {
    success: true,
    data: {
      alerts: [],
      timestamp: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock service responses
    farmMonitoringService.getLatestReading.mockResolvedValue(mockLatestData);
    farmMonitoringService.getHistoricalData.mockResolvedValue(mockHistoricalData);
    farmMonitoringService.getSensorStats.mockResolvedValue(mockStats);
    farmMonitoringService.getPredictiveAnalytics.mockResolvedValue(mockAnalytics);
    farmMonitoringService.getAlerts.mockResolvedValue(mockAlerts);
    farmMonitoringService.fetchAndStoreSensorData.mockResolvedValue({ success: true });
    farmMonitoringService.exportSensorDataCSV.mockResolvedValue({ success: true });
    farmMonitoringService.exportSensorDataPDF.mockResolvedValue({ success: true });
  });

  it('renders without crashing', async () => {
    render(<FarmMonitoring />);
    
    // Wait for initial data loading
    await waitFor(() => {
      expect(screen.getByText('Farm Monitoring Dashboard')).toBeInTheDocument();
    });
  });

  it('displays sensor data correctly', async () => {
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      expect(screen.getByText('25.5°C')).toBeInTheDocument();
      expect(screen.getByText('60.2%')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  it('displays statistics correctly', async () => {
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      expect(screen.getByText('Min: 20.0°C')).toBeInTheDocument();
      expect(screen.getByText('Max: 30.0°C')).toBeInTheDocument();
      expect(screen.getByText('Avg: 25.0°C')).toBeInTheDocument();
    });
  });

  it('handles fetch new data button click', async () => {
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      const fetchButton = screen.getByText('Fetch New Data');
      fireEvent.click(fetchButton);
      
      expect(farmMonitoringService.fetchAndStoreSensorData).toHaveBeenCalled();
    });
  });

  it('handles CSV export button click', async () => {
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);
      
      expect(farmMonitoringService.exportSensorDataCSV).toHaveBeenCalled();
    });
  });

  it('handles PDF export button click', async () => {
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      const exportButton = screen.getByText('Export PDF');
      fireEvent.click(exportButton);
      
      expect(farmMonitoringService.exportSensorDataPDF).toHaveBeenCalled();
    });
  });

  it('displays loading state initially', () => {
    // Mock loading state
    farmMonitoringService.getLatestReading.mockReturnValue(new Promise(() => {}));
    farmMonitoringService.getHistoricalData.mockReturnValue(new Promise(() => {}));
    
    render(<FarmMonitoring />);
    
    expect(screen.getByText('Loading sensor data...')).toBeInTheDocument();
  });

  it('handles authentication error', async () => {
    // Mock auth error
    farmMonitoringService.getLatestReading.mockRejectedValue({
      response: { status: 401 },
    });
    
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });
  });

  it('displays alerts when available', async () => {
    const mockAlertsWithData = {
      success: true,
      data: {
        alerts: [
          {
            type: 'temperature',
            severity: 'high',
            message: 'High temperature detected',
            recommendation: 'Provide shade',
          },
        ],
        timestamp: new Date().toISOString(),
      },
    };
    
    farmMonitoringService.getAlerts.mockResolvedValue(mockAlertsWithData);
    
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      expect(screen.getByText('High temperature detected')).toBeInTheDocument();
    });
  });

  it('displays recommendations', async () => {
    const mockAnalyticsWithRecommendations = {
      success: true,
      data: {
        ...mockAnalytics.data,
        recommendations: [
          'Temperature is rising rapidly. Consider shade protection for crops.',
          'Humidity is decreasing. Crops may need more frequent watering.',
        ],
      },
    };
    
    farmMonitoringService.getPredictiveAnalytics.mockResolvedValue({
      success: true,
      data: mockAnalyticsWithRecommendations.data,
    });
    
    render(<FarmMonitoring />);
    
    await waitFor(() => {
      expect(
        screen.getByText('Temperature is rising rapidly. Consider shade protection for crops.')
      ).toBeInTheDocument();
    });
  });
});