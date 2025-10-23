import apiClient from './apiClient';

// Fetch user's booking history
export const fetchUserBookings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.status) params.append('status', filters.status);
    
    const response = await apiClient.get(`/warehouse-bookings/my-bookings?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

// Fetch user's soil history
export const fetchSoilHistory = async (months = 6) => {
  try {
    const response = await apiClient.get(`/reports/soil?months=${months}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching soil history:', error);
    throw error;
  }
};

// Fetch user's crops report
export const fetchCropsReport = async () => {
  try {
    const response = await apiClient.get('/reports/crops');
    return response.data;
  } catch (error) {
    console.error('Error fetching crops report:', error);
    throw error;
  }
};

// Export report data
export const exportReportData = async (format, reportType, data) => {
  try {
    // In a real implementation, this would send the data to the backend for processing
    // For now, we'll simulate the export by creating a downloadable file
    
    let content = '';
    let filename = `report.${format}`;
    let mimeType = 'text/csv';
    
    switch (format) {
      case 'csv':
        // Convert data to CSV format
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(row => 
            Object.values(row).map(value => 
              typeof value === 'string' ? `"${value}"` : value
            ).join(',')
          ).join('\n');
          content = `${headers}\n${rows}`;
        }
        filename = `${reportType}-report.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'excel':
        // For Excel, we'll create a CSV file (Excel can open CSV)
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(row => 
            Object.values(row).map(value => 
              typeof value === 'string' ? `"${value}"` : value
            ).join(',')
          ).join('\n');
          content = `${headers}\n${rows}`;
        }
        filename = `${reportType}-report.xls`;
        mimeType = 'application/vnd.ms-excel';
        break;
        
      case 'pdf':
        // For PDF, we'll create a simple text representation
        content = JSON.stringify(data, null, 2);
        filename = `${reportType}-report.pdf`;
        mimeType = 'application/pdf';
        break;
        
      default:
        throw new Error('Unsupported format');
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};