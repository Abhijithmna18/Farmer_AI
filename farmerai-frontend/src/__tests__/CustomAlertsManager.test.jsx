import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomAlertsManager from '../components/CustomAlertsManager';
import * as farmMonitoringService from '../services/farmMonitoring.service';

// Mock the farm monitoring service
jest.mock('../services/farmMonitoring.service');

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CustomAlertsManager', () => {
  const mockAlerts = [
    {
      type: 'temperature',
      threshold: 30,
      condition: 'above',
      severity: 'high',
      message: 'Temperature is too high',
      recommendation: 'Provide shade',
    },
    {
      type: 'soilMoisture',
      threshold: 300,
      condition: 'below',
      severity: 'critical',
      message: 'Soil moisture is too low',
      recommendation: 'Irrigate immediately',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CustomAlertsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Custom Alerts Manager')).toBeInTheDocument();
    });
  });

  it('displays existing alerts', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    render(<CustomAlertsManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Temperature is too high')).toBeInTheDocument();
      expect(screen.getByText('Soil moisture is too low')).toBeInTheDocument();
    });
  });

  it('shows form when Add Alert button is clicked', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CustomAlertsManager />);
    
    const addButton = screen.getByText('Add Alert');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Alert')).toBeInTheDocument();
    });
  });

  it('hides form when Cancel button is clicked', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: [],
    });

    render(<CustomAlertsManager />);
    
    // Show form first
    const addButton = screen.getByText('Add Alert');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Create New Alert')).toBeInTheDocument();
    });
    
    // Then hide it
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Create New Alert')).not.toBeInTheDocument();
  });

  it('submits form to create new alert', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: [],
    });
    
    farmMonitoringService.createCustomAlert.mockResolvedValue({
      success: true,
      data: {
        type: 'humidity',
        threshold: 80,
        condition: 'above',
        severity: 'medium',
        message: 'Humidity is too high',
        recommendation: 'Increase ventilation',
      },
    });

    render(<CustomAlertsManager />);
    
    // Show form
    const addButton = screen.getByText('Add Alert');
    fireEvent.click(addButton);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Threshold Value'), {
      target: { value: '80' },
    });
    
    fireEvent.change(screen.getByLabelText('Alert Message'), {
      target: { value: 'Humidity is too high' },
    });
    
    // Submit form
    const submitButton = screen.getByText('Create Alert');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(farmMonitoringService.createCustomAlert).toHaveBeenCalledWith({
        type: 'temperature',
        threshold: '80',
        condition: 'above',
        severity: 'medium',
        message: 'Humidity is too high',
        recommendation: '',
      });
    });
  });

  it('displays appropriate severity indicators', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: mockAlerts,
    });

    render(<CustomAlertsManager />);
    
    await waitFor(() => {
      // Check for critical severity styling
      const criticalAlert = screen.getByText('Soil moisture is too low');
      expect(criticalAlert.closest('.bg-red-100')).toBeInTheDocument();
      
      // Check for high severity styling
      const highAlert = screen.getByText('Temperature is too high');
      expect(highAlert.closest('.bg-orange-100')).toBeInTheDocument();
    });
  });

  it('handles form validation errors', async () => {
    farmMonitoringService.getCustomAlerts.mockResolvedValue({
      success: true,
      data: [],
    });
    
    farmMonitoringService.createCustomAlert.mockRejectedValue({
      response: { status: 400 },
    });

    render(<CustomAlertsManager />);
    
    // Show form
    const addButton = screen.getByText('Add Alert');
    fireEvent.click(addButton);
    
    // Submit empty form
    const submitButton = screen.getByText('Create Alert');
    fireEvent.click(submitButton);
    
    // Form should still be visible (not submitted)
    await waitFor(() => {
      expect(screen.getByText('Create New Alert')).toBeInTheDocument();
    });
  });
});