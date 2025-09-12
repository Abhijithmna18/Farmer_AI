import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { date: 'Jan', pH: 6.2, moisture: 45, nutrients: 78 },
  { date: 'Feb', pH: 6.4, moisture: 52, nutrients: 82 },
  { date: 'Mar', pH: 6.1, moisture: 48, nutrients: 75 },
  { date: 'Apr', pH: 6.3, moisture: 55, nutrients: 85 },
  { date: 'May', pH: 6.5, moisture: 58, nutrients: 88 },
  { date: 'Jun', pH: 6.2, moisture: 50, nutrients: 80 },
];

export default function SoilTrendsChart() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Soil Trends (Last 6 Months)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
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
            <Line 
              type="monotone" 
              dataKey="pH" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              name="pH Level"
            />
            <Line 
              type="monotone" 
              dataKey="moisture" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Moisture %"
            />
            <Line 
              type="monotone" 
              dataKey="nutrients" 
              stroke="#F59E0B" 
              strokeWidth={2}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              name="Nutrients %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}








