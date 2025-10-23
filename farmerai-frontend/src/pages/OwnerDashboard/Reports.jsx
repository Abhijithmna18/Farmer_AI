import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { 
  fetchRevenueReport, 
  fetchBookingReport, 
  fetchInventoryReport, 
  fetchCustomerReport, 
  fetchWarehouseReport, 
  fetchFinancialReport,
  exportReport
} from '../../services/reportsService';

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report', icon: '💰', description: 'Detailed revenue analysis' },
    { value: 'bookings', label: 'Booking Report', icon: '📦', description: 'Booking trends and patterns' },
    { value: 'inventory', label: 'Inventory Report', icon: '📋', description: 'Stock levels and movements' },
    { value: 'customers', label: 'Customer Report', icon: '👥', description: 'Customer analytics and behavior' },
    { value: 'warehouses', label: 'Warehouse Report', icon: '🏪', description: 'Warehouse performance metrics' },
    { value: 'financial', label: 'Financial Report', icon: '📊', description: 'Complete financial overview' }
  ];

  useEffect(() => {
    loadReports();
  }, [selectedReport, dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load the appropriate report based on selection
      let reportData;
      
      switch (selectedReport) {
        case 'revenue':
          reportData = await fetchRevenueReport(dateRange);
          break;
        case 'bookings':
          reportData = await fetchBookingReport(dateRange);
          break;
        case 'inventory':
          reportData = await fetchInventoryReport(dateRange);
          break;
        case 'customers':
          reportData = await fetchCustomerReport(dateRange);
          break;
        case 'warehouses':
          reportData = await fetchWarehouseReport(dateRange);
          break;
        case 'financial':
          reportData = await fetchFinancialReport(dateRange);
          break;
        default:
          reportData = await fetchRevenueReport(dateRange);
      }
      
      setReports({
        [selectedReport]: reportData
      });
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load reports: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      await exportReport(format, selectedReport, dateRange);
    } catch (err) {
      console.error(`Failed to export ${selectedReport} report as ${format}:`, err);
      alert(`Failed to export report: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadReports}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate detailed reports for your warehouse business</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map(report => (
          <button
            key={report.value}
            onClick={() => setSelectedReport(report.value)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedReport === report.value
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{report.icon}</span>
              <div>
                <div className="font-medium">{report.label}</div>
                <div className="text-sm text-gray-600">{report.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {reportTypes.find(r => r.value === selectedReport)?.label}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl border p-6">
        {selectedReport === 'revenue' && reports?.revenue && <RevenueReport data={reports.revenue} />}
        {selectedReport === 'bookings' && reports?.bookings && <BookingReport data={reports.bookings} />}
        {selectedReport === 'inventory' && reports?.inventory && <InventoryReport data={reports.inventory} />}
        {selectedReport === 'customers' && reports?.customers && <CustomerReport data={reports.customers} />}
        {selectedReport === 'warehouses' && reports?.warehouses && <WarehouseReport data={reports.warehouses} />}
        {selectedReport === 'financial' && reports?.financial && <FinancialReport data={reports.financial} />}
      </div>
    </div>
  );
}

function RevenueReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Revenue Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Revenue" value={`₹${data.summary.totalRevenue.toLocaleString()}`} />
        <SummaryCard title="Monthly Revenue" value={`₹${data.summary.monthlyRevenue.toLocaleString()}`} />
        <SummaryCard title="Daily Average" value={`₹${Math.round(data.summary.averageDailyRevenue).toLocaleString()}`} />
        <SummaryCard title="Growth Rate" value={`${data.summary.growthRate.toFixed(1)}%`} />
      </div>

      {/* Revenue Breakdown */}
      <div>
        <h4 className="text-lg font-medium mb-4">Revenue by Source</h4>
        <div className="space-y-3">
          {data.breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium">{item.source}</span>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{item.revenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trends */}
      <div>
        <h4 className="text-lg font-medium mb-4">Monthly Revenue Trends</h4>
        <div className="grid grid-cols-6 gap-4">
          {data.trends.map((trend, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-gray-600">{trend.month}</div>
              <div className="font-medium">₹{(trend.revenue / 1000).toFixed(0)}k</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Booking Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Bookings" value={data.summary.totalBookings} />
        <SummaryCard title="Approved" value={data.summary.approvedBookings} />
        <SummaryCard title="Pending" value={data.summary.pendingBookings} />
        <SummaryCard title="Conversion Rate" value={`${data.summary.conversionRate.toFixed(1)}%`} />
      </div>

      {/* Booking Trends */}
      <div>
        <h4 className="text-lg font-medium mb-4">Weekly Booking Trends</h4>
        <div className="grid grid-cols-4 gap-4">
          {data.trends.map((trend, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">{trend.week}</div>
              <div className="text-xl font-bold">{trend.bookings}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings by Warehouse */}
      <div>
        <h4 className="text-lg font-medium mb-4">Bookings by Warehouse</h4>
        <div className="space-y-3">
          {data.byWarehouse.map((warehouse, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{warehouse.warehouse}</span>
              <div className="text-right">
                <div className="font-medium">{warehouse.bookings} bookings</div>
                <div className="text-sm text-gray-600">₹{warehouse.revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Inventory Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Items" value={data.summary.totalItems} />
        <SummaryCard title="Low Stock" value={data.summary.lowStockItems} />
        <SummaryCard title="Out of Stock" value={data.summary.outOfStockItems} />
        <SummaryCard title="Total Value" value={`₹${data.summary.totalValue.toLocaleString()}`} />
      </div>

      {/* Inventory by Category */}
      <div>
        <h4 className="text-lg font-medium mb-4">Inventory by Category</h4>
        <div className="space-y-3">
          {data.categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{category.category}</div>
                <div className="text-sm text-gray-600">{category.items} items</div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{category.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Turnover: {category.turnover}x</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      <div>
        <h4 className="text-lg font-medium mb-4 text-red-600">Low Stock Items</h4>
        <div className="space-y-3">
          {data.lowStock.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <div className="font-medium text-red-800">{item.item}</div>
                <div className="text-sm text-red-600">Current: {item.current} | Reorder: {item.reorder}</div>
              </div>
              <div className="text-sm text-red-600">{item.supplier}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Customer Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Customers" value={data.summary.totalCustomers} />
        <SummaryCard title="New Customers" value={data.summary.newCustomers} />
        <SummaryCard title="Returning" value={data.summary.returningCustomers} />
        <SummaryCard title="Retention Rate" value={`${data.summary.customerRetentionRate}%`} />
      </div>

      {/* Top Customers */}
      <div>
        <h4 className="text-lg font-medium mb-4">Top Customers</h4>
        <div className="space-y-3">
          {data.topCustomers.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.bookings} bookings</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{customer.revenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">
                  Last: {new Date(customer.lastBooking).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Segments */}
      <div>
        <h4 className="text-lg font-medium mb-4">Customer Segments</h4>
        <div className="space-y-3">
          {data.segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{segment.segment}</span>
              <div className="text-right">
                <div className="font-medium">{segment.count} customers</div>
                <div className="text-sm text-gray-600">₹{segment.revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WarehouseReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Warehouse Performance</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Warehouses" value={data.summary.totalWarehouses} />
        <SummaryCard title="Average Occupancy" value={`${data.summary.averageOccupancy.toFixed(1)}%`} />
        <SummaryCard title="Total Capacity" value={`${data.summary.totalCapacity.toLocaleString()} kg`} />
        <SummaryCard title="Utilized" value={`${data.summary.utilizedCapacity.toLocaleString()} kg`} />
      </div>

      {/* Warehouse Performance */}
      <div>
        <h4 className="text-lg font-medium mb-4">Warehouse Performance</h4>
        <div className="space-y-3">
          {data.performance.map((warehouse, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">{warehouse.name}</h5>
                <span className="text-sm text-gray-600">Efficiency: {warehouse.efficiency}%</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Occupancy</div>
                  <div className="font-medium">{warehouse.occupancy}%</div>
                </div>
                <div>
                  <div className="text-gray-600">Revenue</div>
                  <div className="font-medium">₹{warehouse.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Bookings</div>
                  <div className="font-medium">{warehouse.bookings}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinancialReport({ data }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Financial Overview</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Revenue" value={`₹${data.summary.totalRevenue.toLocaleString()}`} />
        <SummaryCard title="Gross Profit" value={`₹${data.summary.grossProfit.toLocaleString()}`} />
        <SummaryCard title="Net Profit" value={`₹${data.summary.netProfit.toLocaleString()}`} />
        <SummaryCard title="Profit Margin" value={`${data.summary.profitMargin.toFixed(1)}%`} />
      </div>

      {/* Cost Breakdown */}
      <div>
        <h4 className="text-lg font-medium mb-4">Cost Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span>Revenue</span>
            <span className="font-medium">₹{data.breakdown.revenue.toLocaleString()}</span>
          </div>
          <div className="ml-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Maintenance</span>
              <span>₹{data.breakdown.costs.maintenance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilities</span>
              <span>₹{data.breakdown.costs.utilities.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Staff</span>
              <span>₹{data.breakdown.costs.staff.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Marketing</span>
              <span>₹{data.breakdown.costs.marketing.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Other</span>
              <span>₹{data.breakdown.costs.other.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg font-medium">
            <span>Net Profit</span>
            <span>₹{data.breakdown.profit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div>
        <h4 className="text-lg font-medium mb-4">Monthly Financial Trends</h4>
        <div className="grid grid-cols-6 gap-4">
          {data.trends.map((trend, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">{trend.month}</div>
              <div className="font-medium">₹{(trend.revenue / 1000).toFixed(0)}k</div>
              <div className="text-xs text-emerald-600">₹{(trend.profit / 1000).toFixed(0)}k profit</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}