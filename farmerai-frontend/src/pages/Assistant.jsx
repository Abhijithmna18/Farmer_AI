import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { auth } from '../firebase';
import assistantService from '../services/assistantService';

const Assistant = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('kerala');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
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
      const res = await apiClient.get('/assistant/insights', { params: { location } });
      setInsights(res?.data?.data || null);
      const first = res?.data?.data?.tasks?.[0];
      if (first) toast(`🌱 ${first}`);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load insights';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      await ensureToken();
      const t = await assistantService.listTasks();
      setTasks(t);
    } catch (e) {
      toast.error('Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    loadTasks();
  }, []);

  useEffect(() => {
    gsap.fromTo(cardsRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
  }, [loading]);

  // Persistent tasks actions
  const addTask = async (title) => {
    try {
      await ensureToken();
      const created = await assistantService.createTask({ title });
      setTasks((prev) => [created, ...prev]);
      toast.success('Task added');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to add task';
      console.error('Add task error:', e);
      toast.error(msg);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await ensureToken();
      const proTip = !task.completed ? 'Use a neem oil + soap spray early morning for better efficacy.' : undefined;
      const updated = await assistantService.completeTask({ id: task._id, completed: !task.completed, proTip });
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      if (updated.completed) toast.success('Task marked complete'); else toast('Marked as pending');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const removeTask = async (task) => {
    try {
      await ensureToken();
      const ok = await assistantService.deleteTask(task._id);
      if (ok) setTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success('Task deleted');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to delete task';
      console.error('Delete task error:', e);
      toast.error(msg);
    }
  };

  const addCustomTask = async () => {
    const title = prompt('Task title');
    if (!title) return;
    const dueDate = prompt('Due date (YYYY-MM-DD)');
    try {
      await ensureToken();
      // Persist via Task Planner
      const created = await assistantService.createTask({ title, dueDate });
      setTasks((prev) => [created, ...prev]);
      // Best-effort legacy logging endpoint (non-blocking)
      apiClient.post('/assistant/tasks/custom', { title, dueDate, reminder: true }).catch(() => {});
      toast.success('Custom task added');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to add task';
      console.error('Add custom task error:', e);
      toast.error(msg);
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Advisor Assistant</h1>
        <div className="flex items-center gap-2">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Location (e.g., kerala)"
          />
          <button onClick={refresh} disabled={loading} className={`px-3 py-2 rounded-lg text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading ? 'Refreshing…' : 'Refresh Insights'}</button>
        </div>
      </div>

      {/* Task Planner */}
      <div ref={el => (cardsRef.current[0] = el)} className="p-4 border rounded-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Task Planner</div>
          <div className="flex gap-2">
            <button onClick={addCustomTask} className="text-sm px-2 py-1 bg-emerald-600 text-white rounded-md">Add Task</button>
          </div>
        </div>

        {/* Suggested by Assistant (from insights) */}
        <div className="mb-3">
          <div className="text-sm font-medium mb-2">Suggested</div>
          {loading ? (
            <div className="text-sm text-gray-500">Loading suggestions…</div>
          ) : insights?.tasks?.length ? (
            <ul className="space-y-2">
              {insights.tasks.map((t, i) => (
                <li key={i} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="text-sm">
                    {t}
                    {/humidity|fungal|blight|post-monsoon/i.test(t) && (
                      <span className="ml-2 text-xs text-red-600 font-semibold">HIGH PRIORITY</span>
                    )}
                  </div>
                  <button onClick={() => addTask(t)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">Add</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No suggestions</div>
          )}
        </div>

        {/* My Tasks (persistent) */}
        <div>
          <div className="text-sm font-medium mb-2">My Tasks</div>
          {tasksLoading ? (
            <div className="text-sm text-gray-500">Loading my tasks…</div>
          ) : tasks.length ? (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task._id} className={`flex items-center justify-between p-2 rounded-lg border ${task.completed ? 'bg-green-50' : ''}`}>
                  <div className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task)} />
                    <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">• due {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                    {task.proTip && task.completed && (
                      <span title="Pro Tip" className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Pro Tip saved</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleComplete(task)} className="text-xs px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200">{task.completed ? 'Mark Pending' : 'Mark Done'}</button>
                    <button onClick={() => removeTask(task)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No tasks added yet</div>
          )}
        </div>
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
        {loading ? (
          <div className="text-sm text-gray-500">Loading market data…</div>
        ) : trendData.length ? (
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
        {loading ? (
          <div className="text-sm text-gray-500">Loading forecast…</div>
        ) : insights?.weather?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {insights.weather.map((w, i) => (
              <div key={i} className="p-3 rounded-lg border text-sm bg-gray-50">
                <div className="font-medium mb-1">{w.day}</div>
                <div className="text-2xl mb-1">{w.icon === 'rain' ? '🌧️' : w.icon === 'cloud' ? '☁️' : '☀️'}</div>
                <div>Rain: {w.rain ?? 0} mm</div>
                <div>Temp: {w.temp}°C</div>
                <div>Humidity: {w.humidity}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No forecast</div>
        )}

        {loading ? null : insights?.hourly?.length ? (
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-2 min-w-[600px]">
              {insights.hourly.map((h, i) => (
                <div key={i} className="p-2 border rounded-lg bg-white text-xs">
                  <div className="font-medium">{h.time}</div>
                  <div>{h.icon === 'rain' ? '🌧️' : h.icon === 'cloud' ? '☁️' : '☀️'}</div>
                  <div>{h.temp}°C • {h.humidity}%</div>
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

export default Assistant;