import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { day: 'Mon', rainfall: 12, temperature: 24 },
  { day: 'Tue', rainfall: 8, temperature: 26 },
  { day: 'Wed', rainfall: 15, temperature: 22 },
  { day: 'Thu', rainfall: 3, temperature: 28 },
  { day: 'Fri', rainfall: 20, temperature: 20 },
  { day: 'Sat', rainfall: 5, temperature: 25 },
  { day: 'Sun', rainfall: 18, temperature: 23 },
];

export default function RainfallForecastChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        7-Day Rainfall Forecast
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              className="text-xs"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: '#6B7280' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Legend />
            <Bar 
              dataKey="rainfall" 
              fill="#3B82F6" 
              name="Rainfall (mm)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Expected Rainfall</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Optimal for Growth</span>
        </div>
      </div>
    </div>
  );
}








