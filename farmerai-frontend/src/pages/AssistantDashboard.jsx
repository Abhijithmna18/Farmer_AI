import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { auth } from '../firebase';

const AssistantDashboard = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef([]);

  const ensureToken = async () => {
    try {
      const current = auth.currentUser;
      if (current) {
        const t = await current.getIdToken();
        if (t) localStorage.setItem('token', t);
      }
    } catch {}
  };

  const refresh = async () => {
    try {
      setLoading(true);
      await ensureToken();
      const res = await apiClient.get('/assistant/insights', { params: { location: 'kerala' } });
      setInsights(res?.data?.data || null);
      const first = res?.data?.data?.tasks?.[0];
      if (first) toast(`🌱 ${first}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    gsap.fromTo(cardsRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
  }, [loading]);

  const markComplete = async (task) => {
    try {
      await ensureToken();
      const proTip = 'Use a neem oil + soap spray early morning for better efficacy.';
      await apiClient.post('/assistant/tasks/complete', { task, proTip });
      toast.success('Great job! Pro Tip unlocked.');
    } catch (e) {
      toast.error('Failed to mark complete');
    }
  };

  const addCustomTask = async () => {
    const title = prompt('Task title');
    if (!title) return;
    const dueDate = prompt('Due date (YYYY-MM-DD)');
    try {
      await ensureToken();
      await apiClient.post('/assistant/tasks/custom', { title, dueDate, reminder: true });
      toast.success('Custom task added');
    } catch (e) {
      toast.error('Failed to add task');
    }
  };

  const setPriceAlert = async (commodity) => {
    const threshold = Number(prompt(`Set ${commodity} alert threshold`));
    if (!Number.isFinite(threshold)) return;
    try {
      await ensureToken();
      await apiClient.post('/assistant/alerts/price', { commodity, threshold });
      toast.success('Price alert set');
    } catch (e) {
      toast.error('Failed to set alert');
    }
  };

  const trendData = insights?.marketTrends ? (insights.marketTrends.rubber || []).map((v, idx) => ({
    day: idx + 1,
    rubber: v,
    pepper: insights.marketTrends.pepper?.[idx] || null,
    rubberMA: (insights.marketTrends.rubber || []).slice(Math.max(0, idx - 29), idx + 1).reduce((a, b) => a + b, 0) / Math.min(idx + 1, 30)
  })) : [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Advisor Assistant</h1>
        <button onClick={refresh} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Refresh Insights</button>
      </div>

      {/* Task Planner */}
      <div ref={el => (cardsRef.current[0] = el)} className="p-4 border rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Task Planner</div>
          <button onClick={addCustomTask} className="text-sm px-2 py-1 bg-emerald-600 text-white rounded-md">Add Task</button>
        </div>
        {insights?.tasks?.length ? (
          <ul className="space-y-2">
            {insights.tasks.map((t, i) => (
              <li key={i} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="text-sm">
                  {t}
                  {/humidity|fungal|blight|post-monsoon/i.test(t) && (
                    <span className="ml-2 text-xs text-red-600 font-semibold">HIGH PRIORITY</span>
                  )}
                </div>
                <button onClick={() => markComplete(t)} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200">Mark Done</button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No tasks</div>
        )}
      </div>

      {/* Market Trends */}
      <div ref={el => (cardsRef.current[1] = el)} className="p-4 border rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Market Trends</div>
          <div className="space-x-2">
            <button onClick={() => setPriceAlert('rubber')} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200">Set Rubber Alert</button>
            <button onClick={() => setPriceAlert('pepper')} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200">Set Pepper Alert</button>
          </div>
        </div>
        {trendData.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rubber" stroke="#10B981" dot={false} />
                <Line type="monotone" dataKey="pepper" stroke="#3B82F6" dot={false} />
                <Line type="monotone" dataKey="rubberMA" stroke="#111827" strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No market data</div>
        )}
        {insights?.marketDrivers && (
          <div className="mt-2 text-sm text-gray-700">{insights.marketDrivers}</div>
        )}
      </div>

      {/* Weather Advisor */}
      <div ref={el => (cardsRef.current[2] = el)} className="p-4 border rounded-2xl bg-white">
        <div className="font-semibold mb-2">Weather Advisor</div>
        {insights?.weather?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {insights.weather.map((w, i) => (
              <div key={i} className="p-3 rounded-lg border text-sm bg-gray-50">
                <div className="font-medium mb-1">{w.day}</div>
                <div className="text-2xl mb-1">{w.icon === 'rain' ? '🌧️' : w.icon === 'cloud' ? '☁️' : '☀️'}</div>
                <div>Rain: {w.rain ?? 0} mm</div>
                <div>Temp: {w.temp}°C</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No forecast</div>
        )}

        {insights?.hourly?.length ? (
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-2 min-w-[600px]">
              {insights.hourly.map((h, i) => (
                <div key={i} className="p-2 border rounded-lg bg-white text-xs">
                  <div className="font-medium">{h.time}</div>
                  <div>{h.icon === 'rain' ? '🌧️' : h.icon === 'cloud' ? '☁️' : '☀️'}</div>
                  <div>{h.temp}°C •%</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {insights?.advice && (
          <div className="mt-3 p-3 bg-yellow-50 border rounded-lg text-sm">{insights.advice}</div>
        )}
      </div>
    </div>
  );
};

export default AssistantDashboard;














