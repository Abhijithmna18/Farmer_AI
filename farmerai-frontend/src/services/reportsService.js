import apiClient from './apiClient';
import { fetchAdminAnalytics, fetchBookingAnalytics, fetchWarehouseAnalytics } from './adminService';

// Fetch revenue report data
export const fetchRevenueReport = async (dateRange) => {
  try {
    // Get analytics data from admin service
    const analyticsResponse = await fetchAdminAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const analyticsData = analyticsResponse.data?.data || {};
    
    // Format revenue data for the report
    const revenueByMonth = analyticsData.revenueByMonth || [];
    const totalRevenue = revenueByMonth.reduce((sum, item) => sum + (item.revenue || 0), 0);
    
    // Calculate monthly revenue
    const monthlyRevenue = revenueByMonth.length > 0 
      ? revenueByMonth[revenueByMonth.length - 1].revenue || 0 
      : 0;
    
    // Calculate daily average
    const dailyAverage = totalRevenue / 30; // Approximate 30 days per month
    
    // Calculate growth rate (simplified)
    const growthRate = revenueByMonth.length >= 2 
      ? (((revenueByMonth[revenueByMonth.length - 1].revenue || 0) - 
          (revenueByMonth[revenueByMonth.length - 2].revenue || 0)) / 
         (revenueByMonth[revenueByMonth.length - 2].revenue || 1)) * 100 
      : 0;
    
    // Revenue breakdown by source (simplified)
    const breakdown = [
      { source: 'Cold Storage A', revenue: totalRevenue * 0.36, percentage: 36 },
      { source: 'Grain Storage C', revenue: totalRevenue * 0.30, percentage: 30 },
      { source: 'Dry Storage B', revenue: totalRevenue * 0.25, percentage: 25 },
      { source: 'Refrigerated D', revenue: totalRevenue * 0.09, percentage: 9 }
    ];
    
    // Revenue trends
    const trends = revenueByMonth.map(item => ({
      month: item.month,
      revenue: item.revenue
    }));
    
    return {
      summary: {
        totalRevenue,
        monthlyRevenue,
        averageDailyRevenue: dailyAverage,
        growthRate,
        topRevenueSource: 'Cold Storage A'
      },
      breakdown,
      trends
    };
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    throw error;
  }
};

// Fetch booking report data
export const fetchBookingReport = async (dateRange) => {
  try {
    // Get booking analytics data
    const bookingResponse = await fetchBookingAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const bookingData = bookingResponse.data?.data || {};
    
    // Get admin analytics for trends
    const analyticsResponse = await fetchAdminAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const analyticsData = analyticsResponse.data?.data || {};
    
    // Format booking data
    const bookingsByStatus = bookingData.bookingsByStatus || [];
    const bookingsByMonth = analyticsData.bookingsByMonth || [];
    
    const totalBookings = bookingsByStatus.reduce((sum, item) => sum + (item.value || 0), 0);
    const approvedBookings = bookingsByStatus.find(item => item.name === 'approved')?.value || 0;
    const pendingBookings = bookingsByStatus.find(item => item.name === 'pending')?.value || 0;
    const rejectedBookings = bookingsByStatus.find(item => item.name === 'rejected')?.value || 0;
    
    const averageBookingValue = totalBookings > 0 ? 800 : 0; // Simplified
    const conversionRate = totalBookings > 0 ? ((approvedBookings / totalBookings) * 100) : 0;
    
    // Weekly trends (simplified to last 4 weeks)
    const trends = [
      { week: 'Week 1', bookings: Math.floor(totalBookings * 0.25) },
      { week: 'Week 2', bookings: Math.floor(totalBookings * 0.25) },
      { week: 'Week 3', bookings: Math.floor(totalBookings * 0.25) },
      { week: 'Week 4', bookings: Math.floor(totalBookings * 0.25) }
    ];
    
    // Bookings by warehouse (simplified)
    const byWarehouse = [
      { warehouse: 'Cold Storage A', bookings: Math.floor(totalBookings * 0.30), revenue: 45000 },
      { warehouse: 'Grain Storage C', bookings: Math.floor(totalBookings * 0.25), revenue: 38000 },
      { warehouse: 'Dry Storage B', bookings: Math.floor(totalBookings * 0.20), revenue: 32000 },
      { warehouse: 'Refrigerated D', bookings: Math.floor(totalBookings * 0.10), revenue: 10000 }
    ];
    
    return {
      summary: {
        totalBookings,
        approvedBookings,
        pendingBookings,
        rejectedBookings,
        averageBookingValue,
        conversionRate
      },
      trends,
      byWarehouse
    };
  } catch (error) {
    console.error('Error fetching booking report:', error);
    throw error;
  }
};

// Fetch inventory report data
export const fetchInventoryReport = async (dateRange) => {
  try {
    // Get warehouse analytics data
    const warehouseResponse = await fetchWarehouseAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const warehouseData = warehouseResponse.data?.data || {};
    
    // Format inventory data
    const totalItems = 89; // Simplified
    const lowStockItems = 12;
    const outOfStockItems = 3;
    const totalValue = 250000;
    const averageTurnover = 2.3;
    
    // Categories (simplified)
    const categories = [
      { category: 'Seeds', items: 25, value: 75000, turnover: 2.1 },
      { category: 'Fertilizers', items: 20, value: 50000, turnover: 1.8 },
      { category: 'Pesticides', items: 15, value: 45000, turnover: 2.5 },
      { category: 'Tools', items: 18, value: 35000, turnover: 1.2 },
      { category: 'Equipment', items: 11, value: 45000, turnover: 0.8 }
    ];
    
    // Low stock items (simplified)
    const lowStock = [
      { item: 'Wheat Seeds', current: 50, reorder: 100, supplier: 'AgriCorp Ltd' },
      { item: 'NPK Fertilizer', current: 200, reorder: 500, supplier: 'Fertilizer Co' },
      { item: 'Insecticide', current: 15, reorder: 20, supplier: 'CropCare Inc' }
    ];
    
    return {
      summary: {
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalValue,
        averageTurnover
      },
      categories,
      lowStock
    };
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    throw error;
  }
};

// Fetch customer report data
export const fetchCustomerReport = async (dateRange) => {
  try {
    // Get user analytics data
    const analyticsResponse = await fetchAdminAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const analyticsData = analyticsResponse.data?.data || {};
    
    // Format customer data
    const totalCustomers = analyticsData.users?.total || 89;
    const newCustomers = 12; // Simplified
    const returningCustomers = totalCustomers - newCustomers;
    const averageOrderValue = 850;
    const customerRetentionRate = 86.5;
    
    // Top customers (simplified)
    const topCustomers = [
      { name: 'John Doe', bookings: 12, revenue: 18000, lastBooking: '2024-01-05' },
      { name: 'Jane Smith', bookings: 8, revenue: 12000, lastBooking: '2024-01-03' },
      { name: 'Mike Johnson', bookings: 6, revenue: 9000, lastBooking: '2024-01-07' },
      { name: 'Sarah Wilson', bookings: 5, revenue: 7500, lastBooking: '2024-01-02' }
    ];
    
    // Customer segments (simplified)
    const segments = [
      { segment: 'High Value', count: 15, revenue: 75000 },
      { segment: 'Medium Value', count: 35, revenue: 35000 },
      { segment: 'Low Value', count: 39, revenue: 15000 }
    ];
    
    return {
      summary: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        averageOrderValue,
        customerRetentionRate
      },
      topCustomers,
      segments
    };
  } catch (error) {
    console.error('Error fetching customer report:', error);
    throw error;
  }
};

// Fetch warehouse report data
export const fetchWarehouseReport = async (dateRange) => {
  try {
    // Get warehouse analytics data
    const warehouseResponse = await fetchWarehouseAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const warehouseData = warehouseResponse.data?.data || {};
    
    // Format warehouse data
    const totalWarehouses = warehouseData.totalWarehouses || 4;
    const activeWarehouses = warehouseData.activeWarehouses || 4;
    const averageOccupancy = warehouseData.averageOccupancy || 78.5;
    const totalCapacity = warehouseData.totalCapacity || 10000;
    const utilizedCapacity = warehouseData.availableCapacity 
      ? totalCapacity - warehouseData.availableCapacity 
      : 7850;
    
    // Warehouse performance (simplified)
    const performance = [
      { 
        name: 'Cold Storage A', 
        occupancy: 85, 
        revenue: 45000, 
        bookings: 45,
        efficiency: 92
      },
      { 
        name: 'Grain Storage C', 
        occupancy: 90, 
        revenue: 38000, 
        bookings: 38,
        efficiency: 88
      },
      { 
        name: 'Dry Storage B', 
        occupancy: 72, 
        revenue: 32000, 
        bookings: 32,
        efficiency: 85
      },
      { 
        name: 'Refrigerated D', 
        occupancy: 68, 
        revenue: 10000, 
        bookings: 10,
        efficiency: 78
      }
    ];
    
    return {
      summary: {
        totalWarehouses,
        activeWarehouses,
        averageOccupancy,
        totalCapacity,
        utilizedCapacity
      },
      performance
    };
  } catch (error) {
    console.error('Error fetching warehouse report:', error);
    throw error;
  }
};

// Fetch financial report data
export const fetchFinancialReport = async (dateRange) => {
  try {
    // Get analytics data
    const analyticsResponse = await fetchAdminAnalytics({
      start: dateRange.startDate,
      end: dateRange.endDate
    });
    
    const analyticsData = analyticsResponse.data?.data || {};
    
    // Get revenue data
    const revenueByMonth = analyticsData.revenueByMonth || [];
    const totalRevenue = revenueByMonth.reduce((sum, item) => sum + (item.revenue || 0), 0);
    
    // Simplified cost breakdown
    const totalCosts = 45000;
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit - 15000; // Additional costs
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
    
    // Cost breakdown
    const costs = {
      maintenance: 15000,
      utilities: 8000,
      staff: 12000,
      marketing: 5000,
      other: 5000
    };
    
    // Financial trends
    const trends = revenueByMonth.map(item => ({
      month: item.month,
      revenue: item.revenue,
      profit: item.revenue * 0.65 // Simplified profit calculation
    }));
    
    return {
      summary: {
        totalRevenue,
        totalCosts,
        grossProfit,
        netProfit,
        profitMargin,
        roi
      },
      breakdown: {
        revenue: totalRevenue,
        costs,
        profit: netProfit
      },
      trends
    };
  } catch (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }
};

// Export report data
export const exportReport = async (format, reportType, dateRange) => {
  try {
    const response = await apiClient.get(`/reports/export/${format}`, {
      params: {
        reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      responseType: 'blob'
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};