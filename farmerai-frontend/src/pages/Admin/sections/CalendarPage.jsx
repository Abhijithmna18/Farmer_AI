import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import GrowthCalendarForm from '../../../components/admin/GrowthCalendarForm';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export default function CalendarPage() {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    season: '',
    year: '',
    isActive: '',
    crop: ''
  });
  const [meta, setMeta] = useState({ crops: [], seasons: [], years: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, create, edit
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Derived analytics datasets for charts
  const cropDist = (() => {
    const map = new Map();
    calendars.forEach(c => {
      const key = c.cropName || 'Unknown';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  const seasonDist = (() => {
    const map = new Map();
    calendars.forEach(c => {
      const key = c.season || '—';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  const monthlyTrend = (() => {
    // Build YYYY-MM key for planting and harvest
    const fmt = (d) => {
      const dt = new Date(d);
      if (isNaN(dt)) return null;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };
    const planted = new Map();
    const harvested = new Map();
    calendars.forEach(c => {
      const p = c.plantingDate ? fmt(c.plantingDate) : null;
      const h = c.estimatedHarvestDate ? fmt(c.estimatedHarvestDate) : null;
      if (p) planted.set(p, (planted.get(p) || 0) + 1);
      if (h) harvested.set(h, (harvested.get(h) || 0) + 1);
    });
    // Merge keys sorted asc
    const keys = Array.from(new Set([...planted.keys(), ...harvested.keys()])).sort();
    return keys.map(k => ({ month: k, planted: planted.get(k) || 0, harvested: harvested.get(k) || 0 }));
  })();

  // Additional analytics datasets
  const topCrops = (() => {
    return [...cropDist].sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  const statusDist = (() => {
    const active = calendars.filter(c => !!c.isActive).length;
    const inactive = calendars.length - active;
    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive }
    ];
  })();

  const chartColors = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#22C55E', '#F97316'];

  // Fetch growth calendars
  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        search: searchTerm,
        season: filters.season,
        year: filters.year,
        isActive: filters.isActive,
        crop: filters.crop
      });
      
      const response = await apiClient.get(`/admin/growth-calendar?${params.toString()}`);
      const items = response.data.data || [];
      setCalendars(items);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      toast.error('Failed to load growth calendars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [currentPage, searchTerm, filters]);

  // Load meta options for filters
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/growth-calendar/meta');
        const d = res.data?.data || {};
        setMeta({
          crops: Array.isArray(d.crops) ? d.crops : [],
          seasons: Array.isArray(d.seasons) ? d.seasons : [],
          years: Array.isArray(d.years) ? d.years : []
        });
      } catch (e) {
        // Silent fail; keep manual inputs if meta not available
      }
    })();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      season: '',
      year: '',
      isActive: '',
      crop: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Open modal for creating new calendar
  const openCreateModal = () => {
    setSelectedCalendar(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Open modal for viewing/editing calendar
  const openViewModal = (calendar) => {
    setSelectedCalendar(calendar);
    setModalMode('view');
    setShowModal(true);
  };

  // Open modal for editing calendar
  const openEditModal = (calendar) => {
    setSelectedCalendar(calendar);
    setModalMode('edit');
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCalendar(null);
  };

  // Handle form submission
  const handleSubmit = async (data) => {
    try {
      if (modalMode === 'create') {
        await apiClient.post('/admin/growth-calendar', data);
        toast.success('Growth calendar created');
      } else if (modalMode === 'edit' && selectedCalendar) {
        await apiClient.put(`/admin/growth-calendar/${selectedCalendar._id}`, data);
        toast.success('Growth calendar updated');
      }
      
      closeModal();
      fetchCalendars();
    } catch (error) {
      console.error('Error saving calendar:', error);
      toast.error('Failed to save growth calendar');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/admin/growth-calendar/${id}`);
      setConfirmDeleteId(null);
      toast.success('Growth calendar deleted');
      fetchCalendars();
    } catch (error) {
      console.error('Error deleting calendar:', error);
      toast.error('Failed to delete growth calendar');
    }
  };

  // Pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calendar events for react-big-calendar
  const calendarEvents = calendars.flatMap(calendar => {
    const events = [];
    
    // Add planting date event
    if (calendar.plantingDate) {
      events.push({
        id: `${calendar._id}-planting`,
        title: `${calendar.cropName} - Planting`,
        start: new Date(calendar.plantingDate),
        end: new Date(calendar.plantingDate),
        allDay: true,
        resource: { ...calendar, type: 'planting' }
      });
    }
    
    // Add estimated harvest date event
    if (calendar.estimatedHarvestDate) {
      events.push({
        id: `${calendar._id}-harvest`,
        title: `${calendar.cropName} - Harvest`,
        start: new Date(calendar.estimatedHarvestDate),
        end: new Date(calendar.estimatedHarvestDate),
        allDay: true,
        resource: { ...calendar, type: 'harvest' }
      });
    }
    
    // Add crop events
    if (calendar.cropEvents && calendar.cropEvents.length > 0) {
      calendar.cropEvents.forEach(event => {
        events.push({
          id: `${calendar._id}-event-${event._id}`,
          title: `${calendar.cropName} - ${event.title}`,
          start: new Date(event.date),
          end: new Date(event.date),
          allDay: true,
          resource: { ...calendar, event, type: 'crop-event' }
        });
      });
    }
    
    return events;
  });

  // Event style getter
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    
    switch (event.resource.type) {
      case 'planting':
        backgroundColor = '#10B981';
        break;
      case 'harvest':
        backgroundColor = '#EF4444';
        break;
      case 'crop-event':
        backgroundColor = '#8B5CF6';
        break;
      default:
        backgroundColor = '#3174ad';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Sorting
  const sortedCalendars = calendars.sort((a, b) => {
    if (sortKey === 'createdAt') {
      return sortDir === 'asc' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortKey === 'cropName') {
      return sortDir === 'asc' ? a.cropName.localeCompare(b.cropName) : b.cropName.localeCompare(a.cropName);
    } else if (sortKey === 'plantingDate') {
      return sortDir === 'asc' ? new Date(a.plantingDate) - new Date(b.plantingDate) : new Date(b.plantingDate) - new Date(a.plantingDate);
    } else if (sortKey === 'estimatedHarvestDate') {
      return sortDir === 'asc' ? new Date(a.estimatedHarvestDate) - new Date(b.estimatedHarvestDate) : new Date(b.estimatedHarvestDate) - new Date(a.estimatedHarvestDate);
    }
  });

  // Export to Excel
  const handleExportExcel = () => {
    const data = calendars.map(calendar => ({
      'Crop Name': calendar.cropName,
      'Variety': calendar.variety,
      'Planting Date': calendar.plantingDate,
      'Estimated Harvest Date': calendar.estimatedHarvestDate,
      'Season': calendar.season,
      'Year': calendar.year,
      'Status': calendar.isActive ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Growth Calendars');
    XLSX.writeFile(wb, 'growth-calendars.xlsx');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop Distribution */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Crop Distribution</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cropDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {cropDist.map((entry, index) => (
                    <Cell key={`cell-crop-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Season Distribution */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Season Distribution</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={seasonDist} dataKey="value" nameKey="name" outerRadius={80} paddingAngle={2}>
                  {seasonDist.map((entry, index) => (
                    <Cell key={`cell-season-${index}`} fill={chartColors[(index + 2) % chartColors.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Monthly Planting vs Harvest</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Legend />
                <Bar dataKey="planted" name="Planted" fill="#10B981" />
                <Bar dataKey="harvested" name="Harvested" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Calendar Management</h1>
          <p className="text-gray-600">Manage all farmer growth calendars</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Growth Calendar
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by crop name or variety..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                  {meta.crops.length ? (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.crop}
                      onChange={(e) => handleFilterChange('crop', e.target.value)}
                    >
                      <option value="">All</option>
                      {meta.crops.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g., Rice"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.crop}
                      onChange={(e) => handleFilterChange('crop', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  {meta.seasons.length ? (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.season}
                      onChange={(e) => handleFilterChange('season', e.target.value)}
                    >
                      <option value="">All</option>
                      {meta.seasons.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g., 2024-spring"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.season}
                      onChange={(e) => handleFilterChange('season', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  {meta.years.length ? (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                    >
                      <option value="">All</option>
                      {meta.years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      placeholder="e.g., 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Crops */}
        <div className="bg-white rounded-xl shadow p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Top Crops</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCrops} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Legend />
                <Bar dataKey="value" name="Count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active vs Inactive */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Active vs Inactive</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusDist.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planting Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCalendars.map((calendar) => (
                <tr key={calendar._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{calendar.cropName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{calendar.variety || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {calendar.plantingDate ? moment(calendar.plantingDate).format('MMM D, YYYY') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {calendar.estimatedHarvestDate ? moment(calendar.estimatedHarvestDate).format('MMM D, YYYY') : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{calendar.season || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      calendar.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calendar.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(calendar)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(calendar)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const confirm = window.confirm('Send reminder email for this calendar?');
                            if (!confirm) return;
                            await apiClient.post(`/admin/growth-calendar/${calendar._id}/remind`);
                            toast.success('Reminder sent');
                          } catch (e) {
                            toast.error('Failed to send reminder');
                          }
                        }}
                        className="text-amber-600 hover:text-amber-900"
                        title="Remind"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(calendar._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * 10 + 1, totalItems)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> of{' '}
                <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-green-50 border-green-500 text-green-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for View/Create/Edit */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {modalMode === 'create' && 'Create Growth Calendar'}
                    {modalMode === 'edit' && 'Edit Growth Calendar'}
                    {modalMode === 'view' && 'View Growth Calendar'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ×
                  </button>
                </div>
                
                <GrowthCalendarForm
                  calendar={selectedCalendar}
                  mode={modalMode}
                  onSubmit={handleSubmit}
                  onCancel={closeModal}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Growth Calendar</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this growth calendar? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() => handleDelete(confirmDeleteId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}