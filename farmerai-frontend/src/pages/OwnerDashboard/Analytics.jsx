import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/owner/analytics', {
        params: { range: dateRange }
      });
      
      if (response.data?.success) {
        setAnalytics(response.data.data);
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err?.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const metricOptions = [
    { value: 'revenue', label: 'Revenue', icon: '💰' },
    { value: 'bookings', label: 'Bookings', icon: '📦' },
    { value: 'occupancy', label: 'Occupancy', icon: '📈' },
    { value: 'customers', label: 'Customers', icon: '👥' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            onClick={loadAnalytics}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-4">Start by adding warehouses and receiving bookings to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights into your warehouse business</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricOptions.map(metric => (
            <button
              key={metric.value}
              onClick={() => setSelectedMetric(metric.value)}
              className={`p-4 rounded-lg border text-left transition-all ${
                selectedMetric === metric.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{metric.icon}</span>
                <div>
                  <div className="font-medium">{metric.label}</div>
                  <div className="text-sm text-gray-600">
                    {metric.value === 'revenue' && `₹${analytics.revenue?.total?.toLocaleString() || 0}`}
                    {metric.value === 'bookings' && analytics.bookings?.total?.toLocaleString() || 0}
                    {metric.value === 'occupancy' && `${analytics.occupancy?.average?.toFixed(1) || 0}%`}
                    {metric.value === 'customers' && analytics.customers?.total?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">
          {metricOptions.find(m => m.value === selectedMetric)?.label} Trend
        </h2>
        <ChartComponent 
          data={analytics[selectedMetric]?.chartData || []} 
          type={selectedMetric}
        />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`₹${analytics.revenue?.total?.toLocaleString() || 0}`}
          trend={analytics.revenue?.trend || 0}
          icon="💰"
        />
        <KPICard
          title="Total Bookings"
          value={analytics.bookings?.total?.toLocaleString() || 0}
          trend={analytics.bookings?.trend || 0}
          icon="📦"
        />
        <KPICard
          title="Average Occupancy"
          value={`${analytics.occupancy?.average?.toFixed(1) || 0}%`}
          trend={analytics.occupancy?.trend || 0}
          icon="📈"
        />
        <KPICard
          title="Total Customers"
          value={analytics.customers?.total?.toLocaleString() || 0}
          trend={analytics.customers?.trend || 0}
          icon="👥"
        />
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopWarehousesTable data={analytics.topWarehouses || []} />
        <TopCustomersTable data={analytics.topCustomers || []} />
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart data={analytics.occupancy?.chartData || []} />
        <BookingStatusChart data={analytics.bookings || {}} />
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, icon }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl">{icon}</div>
          <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartComponent({ data, type }) {
  // Simple bar chart implementation
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-64 flex items-end space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="bg-emerald-500 rounded-t w-full transition-all duration-500 hover:bg-emerald-600"
            style={{ height: `${(item.value / maxValue) * 200}px` }}
          ></div>
          <div className="text-xs text-gray-600 mt-2">
            {type === 'revenue' ? `₹${(item.value / 1000).toFixed(0)}k` : item.value}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  );
}

function TopWarehousesTable({ data }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Top Performing Warehouses</h3>
      <div className="space-y-3">
        {data.map((warehouse, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <div className="font-medium">{warehouse.name}</div>
                <div className="text-sm text-gray-600">{warehouse.bookings} bookings</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">₹{warehouse.revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">{warehouse.occupancy}% occupancy</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCustomersTable({ data }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
      <div className="space-y-3">
        {data.map((customer, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
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
  );
}

function OccupancyChart({ data }) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Warehouse Occupancy</h3>
      <div className="space-y-4">
        {data.map((warehouse, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{warehouse.warehouse}</span>
              <span>{warehouse.occupancy}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${warehouse.occupancy}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingStatusChart({ data }) {
  const statusData = [
    { status: 'Approved', count: data.approved, color: 'bg-green-500' },
    { status: 'Pending', count: data.pending, color: 'bg-yellow-500' },
    { status: 'Rejected', count: data.rejected, color: 'bg-red-500' }
  ];

  const total = data.approved + data.pending + data.rejected;

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-4">Booking Status Distribution</h3>
      <div className="space-y-3">
        {statusData.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.status}</span>
              <span>{item.count} ({((item.count / total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${(item.count / total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


