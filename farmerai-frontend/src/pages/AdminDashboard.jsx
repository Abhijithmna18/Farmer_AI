import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { glass } from '../styles/globalStyles';
import apiClient from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Reusable StatsCard Component
const StatsCard = ({ title, value, icon, color }) => (
  <motion.div
    className={`${glass.panel} p-6 rounded-lg shadow-lg flex items-center space-x-4`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
  >
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

// Reusable DataTable Component (simplified for now)
const DataTable = ({ columns, data }) => (
  <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          {columns.map((col, index) => (
            <th key={index} scope="col" className="py-3 px-6">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
            {columns.map((col, colIndex) => (
              <td key={colIndex} className="py-4 px-6">{col.accessor ? col.accessor(row) : row[col.field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AdminDashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState('7d'); // '7d' | '30d' | 'all'
  const [region, setRegion] = useState('');
  const [season, setSeason] = useState(''); // 'kharif' | 'rabi' | 'zaid' | ''
  const [selectedCrops, setSelectedCrops] = useState([]); // multi-select for growth comparison
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('admin'))) {
      setError('Access Denied. You must be an administrator to view this page.');
      return;
    }

    const fetchData = async () => {
      try {
        if (activeTab === 'overview') {
          const q = new URLSearchParams();
          if (range && range !== 'all') q.set('range', range);
          if (region) q.set('region', region);
          if (season) q.set('season', season);
          if (selectedCrops.length) q.set('crops', selectedCrops.join(','));
          const [overviewRes, analyticsRes] = await Promise.all([
            apiClient.get('/admin/overview'),
            apiClient.get(`/admin/analytics${q.toString() ? `?${q.toString()}` : ''}`)
          ]);
          // Overview: accept either {success,data} or plain object
          const overviewData = overviewRes.data?.data ?? overviewRes.data ?? null;
          setStats(overviewData);
          // Analytics: accept either {success,data} or plain object
          const analyticsData = analyticsRes.data?.data ?? analyticsRes.data ?? null;
          setAnalytics(analyticsData);
        } else if (activeTab === 'users') {
          const response = await apiClient.get('/admin/users');
          setUsers(response.data);
        } else if (activeTab === 'events') {
          const response = await apiClient.get('/admin/events');
          setEvents(response.data);
        } else if (activeTab === 'registrations') {
          const response = await apiClient.get('/admin/registrations');
          setRegistrations(response.data);
        } else if (activeTab === 'email-logs') {
          const response = await apiClient.get('/admin/email-logs');
          setEmailLogs(response.data);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab} data:`, err);
        setError(err.response?.data?.message || `Failed to fetch ${activeTab} data.`);
      }
    };

    if (user && user.roles.includes('admin')) {
      fetchData();
    }
  }, [activeTab, user, loading, range, region, season, selectedCrops]);

  // Normalizers for charts
  const roleDistribution = useMemo(() => {
    const roles = analytics?.users?.rolesDistribution || analytics?.users?.roles || {};
    // roles expected like { farmer: N, buyer: N, 'warehouse-owner': N, admin: N }
    return Object.entries(roles).map(([name, value]) => ({ name: String(name).replace('-', ' '), value: Number(value) || 0 }));
  }, [analytics]);

  const topCrops = useMemo(() => {
    // expected array of { name, value }
    return analytics?.crops?.topListed || analytics?.marketplace?.topCrops || [];
  }, [analytics]);

  const allCropOptions = useMemo(() => {
    const names = new Set((analytics?.crops?.all || []).concat(topCrops.map(c => c.name || '')));
    return Array.from(names).filter(Boolean).sort();
  }, [analytics, topCrops]);

  const growthSeries = useMemo(() => {
    // Normalize growth series. Accept either array of points per crop:
    // { series: [{ crop: 'Wheat', data: [{ label/date/month, value }, ...] }, ...] }
    const raw = analytics?.crops?.growth || analytics?.crops?.growthSeries || analytics?.growth?.crops || null;
    if (!raw) return [];
    const series = Array.isArray(raw.series) ? raw.series : Array.isArray(raw) ? raw : [];
    return series.map(s => ({ crop: s.crop || s.name, data: (s.data || []).map(p => ({
      label: p.label || p.date || p.month || p.period || '',
      value: Number(p.value) || 0
    })) })).filter(s => s.crop && s.data?.length);
  }, [analytics]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-white">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500 text-xl">{error}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <motion.div
        className="w-64 bg-gray-800 p-6 shadow-lg"
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-green-400">Admin Panel</h2>
        <nav>
          <ul>
            {[ 'overview', 'users', 'events', 'registrations', 'email-logs'].map((item) => (
              <li key={item} className="mb-2">
                <button
                  onClick={() => setActiveTab(item)}
                  className={`w-full text-left py-2 px-4 rounded-md transition-colors duration-200 ${activeTab === item ? 'bg-green-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {activeTab === 'overview' && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatsCard title="Total Users" value={stats.totalUsers} icon="👤" color="bg-blue-500" />
              <StatsCard title="Total Events" value={stats.totalEvents} icon="📅" color="bg-purple-500" />
              <StatsCard title="Verified Events" value={stats.verifiedEvents} icon="✅" color="bg-green-500" />
              <StatsCard title="Pending Events" value={stats.pendingEvents} icon="⏳" color="bg-yellow-500" />
              <StatsCard title="Total Registrations" value={stats.totalRegistrations} icon="📝" color="bg-red-500" />
              <StatsCard title="Emails Sent (Success)" value={stats.successfulEmails} icon="✉️" color="bg-teal-500" />
              <StatsCard title="Emails Sent (Failed)" value={stats.failedEmails} icon="❌" color="bg-orange-500" />
            </div>
            {/* Analytics filters */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Analytics</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-300">Range</label>
                <select value={range} onChange={(e) => setRange(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
                <label className="text-sm text-gray-300 ml-3">Region</label>
                <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., Kerala" className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm" />
                <label className="text-sm text-gray-300 ml-3">Season</label>
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm">
                  <option value="">All</option>
                  <option value="kharif">Kharif</option>
                  <option value="rabi">Rabi</option>
                  <option value="zaid">Zaid</option>
                </select>
              </div>
            </div>

            {analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Roles Distribution */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">User Roles</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={roleDistribution} dataKey="value" nameKey="name" outerRadius={90} label onClick={(entry) => entry?.name && navigate(`/admin/users?role=${encodeURIComponent(entry.name.replace(' ', '-').toLowerCase())}`)}>
                          {roleDistribution.map((_, idx) => (
                            <Cell key={`role-${idx}`} fill={["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Listed Crops */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold">Top Listed Crops</h4>
                    <div className="text-xs text-gray-400">{region || 'All regions'}{season ? ` • ${season}` : ''}</div>
                  </div>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topCrops.slice(0, 8)} onClick={(e) => {
                        const name = e?.activeLabel || e?.activePayload?.[0]?.payload?.name;
                        if (name) navigate(`/admin/crops/${encodeURIComponent(name)}`);
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="name" stroke="#a0aec0" interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis stroke="#a0aec0" allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Bar dataKey="value" fill="#10b981" name="Listings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Users Timeseries */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">User Signups</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={(analytics.users && (analytics.users.timeSeries || analytics.users.timeseries)) || []} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="date" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Marketplace Active vs Inactive */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">Marketplace Listings</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={[{ name: 'Listings', active: analytics.marketplace?.active || 0, inactive: analytics.marketplace?.inactive || 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="name" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Legend />
                        <Bar dataKey="active" fill="#3b82f6" name="Active" />
                        <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Categories Pie */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">Top Categories</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={analytics.marketplace?.topCategories || []} dataKey="value" nameKey="name" outerRadius={90} label>
                          {(analytics.marketplace?.topCategories || []).map((_, idx) => (
                            <Cell key={`cat-${idx}`} fill={["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Crops Pie */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3">Top Crops</h4>
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={analytics.marketplace?.topCrops || []} dataKey="value" nameKey="name" outerRadius={90} label>
                          {(analytics.marketplace?.topCrops || []).map((_, idx) => (
                            <Cell key={`crop-${idx}`} fill={["#06b6d4","#22c55e","#f97316","#eab308","#a855f7"][idx % 5]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Growth Calendar Trend */}
                <div className="bg-gray-800 rounded-lg p-4 lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">Growth Calendar Trend</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <label>Select Crops</label>
                      <select multiple value={selectedCrops} onChange={(e) => setSelectedCrops(Array.from(e.target.selectedOptions).map(o => o.value))} className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1">
                        {allCropOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={(function(){
                        // Convert multi-series into combined by label
                        const map = new Map();
                        growthSeries.forEach(s => {
                          s.data.forEach(p => {
                            const key = p.label;
                            if (!map.has(key)) map.set(key, { label: key });
                            map.get(key)[s.crop] = p.value;
                          });
                        });
                        return Array.from(map.values());
                      })()} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis dataKey="label" stroke="#a0aec0" />
                        <YAxis stroke="#a0aec0" allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} />
                        {(selectedCrops.length ? growthSeries.filter(s => selectedCrops.includes(s.crop)) : growthSeries).slice(0,6).map((s, idx) => (
                          <Line key={s.crop} type="monotone" dataKey={s.crop} stroke={["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4"][idx % 6]} strokeWidth={2} dot={false} />
                        ))}
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 text-gray-300">No analytics available for the selected range.</div>
            )}
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold mb-6">User Management</h2>
            <DataTable
              columns={[
                { header: 'Name', field: 'name' },
                { header: 'Email', field: 'email' },
                { header: 'Roles', accessor: (row) => row.roles.join(', ') },
                { header: 'Verified', accessor: (row) => (row.verified ? 'Yes' : 'No') },
                // Add actions column later
              ]}
              data={users}
            />
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold mb-6">Event Management</h2>
            <DataTable
              columns={[
                { header: 'Title', field: 'title' },
                { header: 'Date', field: 'dateTime' },
                { header: 'Status', field: 'status' },
                { header: 'Farmer Email', field: 'farmerEmail' },
                // Add actions column later
              ]}
              data={events}
            />
          </motion.div>
        )}

        {activeTab === 'registrations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold mb-6">Registrations Management</h2>
            <DataTable
              columns={[
                { header: 'Event', accessor: (row) => row.eventId?.title || 'N/A' },
                { header: 'Registrant Name', accessor: (row) => row.userId?.name || 'N/A' },
                { header: 'Registrant Email', accessor: (row) => row.userId?.email || 'N/A' },
                { header: 'Date', field: 'registrationDate' },
                // Add export CSV later
              ]}
              data={registrations}
            />
          </motion.div>
        )}

        {activeTab === 'email-logs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold mb-6">Email Logs</h2>
            <DataTable
              columns={[
                { header: 'To', field: 'to' },
                { header: 'Subject', field: 'subject' },
                { header: 'Status', field: 'status' },
                { header: 'Timestamp', field: 'timestamp' },
                { header: 'Error', field: 'error' },
                // Add retry action later
              ]}
              data={emailLogs}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
