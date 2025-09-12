import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { glass } from '../styles/globalStyles';
import apiClient from '../services/apiClient';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
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
          const response = await apiClient.get('/admin/overview');
          setStats(response.data);
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
  }, [activeTab, user, loading]);

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
            {/* Recharts integration would go here */}
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
