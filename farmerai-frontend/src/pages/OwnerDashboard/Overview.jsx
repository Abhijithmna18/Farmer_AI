import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import RevenueChart from './components/RevenueChart';
import OccupancyChart from './components/OccupancyChart';
import ActivityFeed from './components/ActivityFeed';
import AlertsPanel from './components/AlertsPanel';
import QuickActions from './components/QuickActions';

export default function OwnerOverview(){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/owner/dashboard');
        if (!cancelled && res.data?.success) {
          setData(res.data.data);
        } else if (!cancelled) {
          setError('Failed to load dashboard data');
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Dashboard error:', e);
          setError(e?.response?.data?.message || 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-600 mb-4">Start by adding your first warehouse to see analytics and insights.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data from real data
  const revenueSeries = data.weeklyTrends?.map((trend, index) => ({
    label: `Week ${index + 1}`,
    revenue: trend.revenue || 0
  })) || [
    { label: 'Week 1', revenue: data.monthlyEarnings || 0 },
    { label: 'Week 2', revenue: 0 },
    { label: 'Week 3', revenue: 0 },
    { label: 'Week 4', revenue: 0 },
  ];

  const occupancySeries = data.occupancyBreakdown?.map(w => ({
    name: w.warehouseName,
    occupancy: w.occupancy || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Warehouses</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalWarehouses || 0}</p>
            </div>
            <div className="text-2xl">🏬</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{data.activeBookings || 0}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Earnings</p>
              <p className="text-2xl font-bold text-emerald-600">₹{data.monthlyEarnings?.toLocaleString() || 0}</p>
              {data.monthlyGrowth !== undefined && (
                <p className={`text-sm ${data.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.monthlyGrowth >= 0 ? '+' : ''}{data.monthlyGrowth}% vs last month
                </p>
              )}
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Occupancy</p>
              <p className="text-2xl font-bold text-purple-600">{data.avgOccupancyPercent || 0}%</p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueSeries} />
        <OccupancyChart data={occupancySeries} />
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed 
          recentBookings={data.recentBookings || []}
          topWarehouses={data.topWarehouses || []}
        />
        <AlertsPanel 
          pendingBookings={data.pendingBookings || 0}
          rejectedBookings={data.rejectedBookings || 0}
          totalCustomers={data.totalCustomers || 0}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">₹{data.weeklyEarnings?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-medium">₹{data.monthlyEarnings?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Year</span>
              <span className="font-medium">₹{data.yearlyEarnings?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-sm font-medium text-gray-900">Total</span>
              <span className="font-bold text-emerald-600">₹{data.totalEarnings?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">{data.pendingBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="font-medium text-green-600">{data.activeBookings || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="font-medium text-red-600">{data.rejectedBookings || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Customers</span>
              <span className="font-medium">{data.totalCustomers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Booking Value</span>
              <span className="font-medium">₹{data.averageBookingValue?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Occupancy Rate</span>
              <span className="font-medium">{data.avgOccupancyPercent || 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }){
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-600">{title}</div>
          <div className="text-2xl font-semibold mt-1">{value}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl">{icon}</div>
          {trend !== 0 && (
            <div className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


