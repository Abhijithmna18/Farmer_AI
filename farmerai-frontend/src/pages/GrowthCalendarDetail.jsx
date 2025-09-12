import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  BarChart3, 
  Download, 
  Upload, 
  Users, 
  Settings,
  ArrowLeft,
  Cloud,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';

import PageHeader from '../components/PageHeader';
import CalendarView from '../components/CalendarView';
import CalendarAnalytics from '../components/CalendarAnalytics';
import RotationRecommendations from '../components/growth-calendar/RotationRecommendations';
import { updateGrowthCalendar } from '../services/calendarService';
import Toast from '../components/Toast';
import { 
  getGrowthCalendarById, 
  addCropEvent, 
  updateCropEvent, 
  deleteCropEvent,
  getCalendarAnalytics,
  getWeatherSuggestions,
  exportCalendar,
  importCalendar,
  inviteCollaborator
} from '../services/calendarService';

const GrowthCalendarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [calendar, setCalendar] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, [id]);

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const response = await getGrowthCalendarById(id);
      setCalendar(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch calendar');
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await getCalendarAnalytics(id);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      const response = await addCropEvent(id, eventData);
      setCalendar(prev => ({
        ...prev,
        cropEvents: [...prev.cropEvents, response.data]
      }));
      setToast({ type: 'success', message: 'Event added successfully' });
      setShowEventModal(false);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add event' });
    }
  };

  const handleEditEvent = async (eventId, updateData) => {
    try {
      const response = await updateCropEvent(id, eventId, updateData);
      setCalendar(prev => ({
        ...prev,
        cropEvents: prev.cropEvents.map(event => 
          event._id === eventId ? response.data : event
        )
      }));
      setToast({ type: 'success', message: 'Event updated successfully' });
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update event' });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteCropEvent(id, eventId);
      setCalendar(prev => ({
        ...prev,
        cropEvents: prev.cropEvents.filter(event => event._id !== eventId)
      }));
      setToast({ type: 'success', message: 'Event deleted successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete event' });
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const blob = await exportCalendar(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${calendar.cropName}-calendar.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ type: 'success', message: 'Calendar exported successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to export calendar' });
    }
  };

  const handleImport = async (file) => {
    try {
      await importCalendar(file);
      setToast({ type: 'success', message: 'Calendar imported successfully' });
      fetchCalendar(); // Refresh calendar data
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to import calendar' });
    }
  };

  const handleInviteCollaborator = async (email, role) => {
    try {
      await inviteCollaborator(id, email, role);
      setToast({ type: 'success', message: 'Collaborator invited successfully' });
      setShowCollaboratorModal(false);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to invite collaborator' });
    }
  };

  const handleGetWeatherSuggestions = async (latitude, longitude, activity) => {
    try {
      const response = await getWeatherSuggestions(latitude, longitude, activity);
      return response.data;
    } catch (err) {
      console.error('Error getting weather suggestions:', err);
      return null;
    }
  };

  const handleViewAnalytics = async (calendarId) => {
    setActiveTab('analytics');
    if (!analytics) {
      await fetchAnalytics();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-4 text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Calendar</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/growth-calendar')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Calendars
        </button>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar Not Found</h2>
        <p className="text-gray-600 mb-4">The requested calendar could not be found.</p>
        <button
          onClick={() => navigate('/growth-calendar')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Calendars
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/growth-calendar')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calendar.cropName}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {calendar.variety && `${calendar.variety} • `}
                  {new Date(calendar.plantingDate).toLocaleDateString()} - {new Date(calendar.estimatedHarvestDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEventModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCollaboratorModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'events', label: 'Events', icon: Clock },
              { id: 'collaborators', label: 'Collaborators', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-200px)]"
            >
              <CalendarView
                calendar={calendar}
                onAddEvent={handleAddEvent}
                onEditEvent={(event) => {
                  setEditingEvent(event);
                  setShowEventModal(true);
                }}
                onDeleteEvent={handleDeleteEvent}
                onExport={handleExport}
                onImport={handleImport}
                onInviteCollaborator={handleInviteCollaborator}
                onViewAnalytics={handleViewAnalytics}
                onGetWeatherSuggestions={handleGetWeatherSuggestions}
              />
              <div className="mt-6">
                <RotationRecommendations
                  calendar={calendar}
                  onSave={async (data) => {
                    try {
                      const res = await updateGrowthCalendar(calendar._id, data);
                      setCalendar(res.data);
                      setToast({ type: 'success', message: 'Rotation notes saved' });
                    } catch (e) {
                      setToast({ type: 'error', message: e?.message || 'Failed to save rotation notes' });
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CalendarAnalytics
                calendarId={id}
                analytics={analytics}
                onRefresh={fetchAnalytics}
              />
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EventsList
                events={calendar.cropEvents || []}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            </motion.div>
          )}

          {activeTab === 'collaborators' && (
            <motion.div
              key="collaborators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CollaboratorsList
                collaborators={calendar.collaborators || []}
                onInvite={handleInviteCollaborator}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
};

export default GrowthCalendarDetail;