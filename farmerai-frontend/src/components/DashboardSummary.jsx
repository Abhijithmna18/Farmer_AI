import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Thermometer, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DashboardSummary({ user }) {
  const [summaryData, setSummaryData] = useState({
    weather: null,
    growthStage: null,
    soilCondition: null,
    loading: true
  });

  useEffect(() => {
    // Simulate fetching summary data
    const fetchSummaryData = async () => {
      try {
        // Mock data - replace with actual API calls
        const mockData = {
          weather: {
            nextEvent: 'Rain expected in 2 days',
            temperature: '24°C',
            humidity: '65%',
            condition: 'Partly Cloudy',
            alert: false
          },
          growthStage: {
            current: 'Vegetative Growth',
            next: 'Flowering',
            daysRemaining: 15,
            progress: 60
          },
          soilCondition: {
            ph: 6.8,
            moisture: 'Good',
            nutrients: 'Optimal',
            lastTested: '3 days ago'
          }
        };
        
        setSummaryData({ ...mockData, loading: false });
      } catch (error) {
        console.error('Failed to fetch summary data:', error);
        setSummaryData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSummaryData();
  }, []);

  if (summaryData.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl border border-green-100 dark:border-slate-700 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Weather Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-xl p-4 rounded-2xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Weather</h3>
          </div>
          {summaryData.weather?.alert && (
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          )}
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {summaryData.weather?.temperature}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {summaryData.weather?.condition}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {summaryData.weather?.nextEvent}
          </div>
        </div>
      </div>

      {/* Growth Stage Summary */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 backdrop-blur-xl p-4 rounded-2xl border border-green-200 dark:border-green-700">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Growth Stage</h3>
        </div>
        <div className="space-y-2">
          <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {summaryData.growthStage?.current}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Next: {summaryData.growthStage?.next}
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${summaryData.growthStage?.progress || 0}%` }}
            ></div>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            {summaryData.growthStage?.daysRemaining} days remaining
          </div>
        </div>
      </div>

      {/* Soil Condition Summary */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 backdrop-blur-xl p-4 rounded-2xl border border-amber-200 dark:border-amber-700">
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Soil Condition</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">pH Level</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {summaryData.soilCondition?.ph}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Moisture</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {summaryData.soilCondition?.moisture}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Nutrients</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {summaryData.soilCondition?.nutrients}
              </span>
            </div>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Last tested: {summaryData.soilCondition?.lastTested}
          </div>
        </div>
      </div>
    </div>
  );
}








