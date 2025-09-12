import React, { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Users, 
  BarChart3,
  Cloud,
  Bell,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const localizer = momentLocalizer(moment);

// Event type colors and icons
const EVENT_TYPES = {
  sowing: { color: '#10B981', icon: '🌱', label: 'Sowing' },
  fertilization: { color: '#F59E0B', icon: '🌿', label: 'Fertilization' },
  irrigation: { color: '#3B82F6', icon: '💧', label: 'Irrigation' },
  harvest: { color: '#EF4444', icon: '🌾', label: 'Harvest' },
  pest_control: { color: '#8B5CF6', icon: '🛡️', label: 'Pest Control' },
  pruning: { color: '#06B6D4', icon: '✂️', label: 'Pruning' },
  weeding: { color: '#84CC16', icon: '🌿', label: 'Weeding' },
  custom: { color: '#6B7280', icon: '📝', label: 'Custom' }
};

const CalendarView = ({ 
  calendar, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent,
  onExport,
  onImport,
  onInviteCollaborator,
  onViewAnalytics,
  onGetWeatherSuggestions
}) => {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    eventTypes: Object.keys(EVENT_TYPES),
    showCompleted: true,
    showPending: true
  });

  // Transform crop events to calendar events
  const events = useMemo(() => {
    if (!calendar?.cropEvents) return [];

    return calendar.cropEvents
      .filter(event => {
        if (!filters.showCompleted && event.isCompleted) return false;
        if (!filters.showPending && !event.isCompleted) return false;
        if (!filters.eventTypes.includes(event.type)) return false;
        return true;
      })
      .map(event => ({
        id: event._id,
        title: `${EVENT_TYPES[event.type]?.icon || '📝'} ${event.title}`,
        start: new Date(event.date),
        end: new Date(event.date),
        resource: event,
        style: {
          backgroundColor: EVENT_TYPES[event.type]?.color || '#6B7280',
          borderColor: EVENT_TYPES[event.type]?.color || '#6B7280',
          color: 'white',
          borderRadius: '6px',
          border: 'none',
          opacity: event.isCompleted ? 0.7 : 1
        }
      }));
  }, [calendar?.cropEvents, filters]);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event.resource);
    setShowEventModal(true);
  }, []);

  const handleSelectSlot = useCallback((slotInfo) => {
    const newEvent = {
      title: '',
      type: 'custom',
      date: slotInfo.start,
      description: '',
      location: '',
      notes: ''
    };
    onAddEvent(newEvent);
  }, [onAddEvent]);

  const eventStyleGetter = (event) => {
    return {
      style: event.style
    };
  };

  const EventComponent = ({ event }) => (
    <div className="flex items-center gap-1 text-xs font-medium">
      <span>{event.title}</span>
      {event.resource?.isCompleted && (
        <CheckCircle className="w-3 h-3 text-white" />
      )}
      {event.resource?.weatherSnapshot && (
        <Cloud className="w-3 h-3 text-white" />
      )}
    </div>
  );

  const EventTooltip = ({ event }) => (
    <div className="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{EVENT_TYPES[event.resource?.type]?.icon}</span>
        <h4 className="font-semibold text-gray-800">{event.resource?.title}</h4>
      </div>
      <p className="text-sm text-gray-600 mb-2">{event.resource?.description}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          {moment(event.start).format('MMM DD, YYYY')}
        </div>
        {event.resource?.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.resource.location}
          </div>
        )}
      </div>
      {event.resource?.weatherSnapshot && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div className="flex items-center gap-1 text-blue-600">
            <Cloud className="w-3 h-3" />
            Weather: {event.resource.weatherSnapshot.condition} ({event.resource.weatherSnapshot.temperature}°C)
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {calendar?.cropName} Calendar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {calendar?.variety && `${calendar.variety} • `}
              {moment(calendar?.plantingDate).format('MMM DD, YYYY')} - {moment(calendar?.estimatedHarvestDate).format('MMM DD, YYYY')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onViewAnalytics(calendar?._id)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onInviteCollaborator(calendar?._id)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Invite Collaborators"
            >
              <Users className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Filter Events"
            >
              <Filter className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onExport(calendar?._id)}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Export Calendar"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onImport(calendar?._id)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Import Calendar"
            >
              <Upload className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Filter Events
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Event Types
                </label>
                <div className="space-y-1">
                  {Object.entries(EVENT_TYPES).map(([type, config]) => (
                    <label key={type} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={filters.eventTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              eventTypes: [...prev.eventTypes, type]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              eventTypes: prev.eventTypes.filter(t => t !== type)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span>{config.icon} {config.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Status
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.showCompleted}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        showCompleted: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Completed
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={filters.showPending}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        showPending: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <Clock className="w-3 h-3 text-yellow-500" />
                    Pending
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(Views.MONTH)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === Views.MONTH
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView(Views.WEEK)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === Views.WEEK
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView(Views.DAY)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                view === Views.DAY
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Day
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          date={date}
          onNavigate={setDate}
          onView={setView}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            tooltip: EventTooltip
          }}
          style={{ height: '100%' }}
          className="dark:bg-gray-900"
        />
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
          onGetWeatherSuggestions={onGetWeatherSuggestions}
        />
      )}
    </div>
  );
};

// Event Modal Component
const EventModal = ({ event, onClose, onEdit, onDelete, onGetWeatherSuggestions }) => {
  const [showWeatherSuggestions, setShowWeatherSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  const handleGetWeatherSuggestions = async () => {
    if (event.location?.coordinates) {
      try {
        const suggestions = await onGetWeatherSuggestions(
          event.location.coordinates.latitude,
          event.location.coordinates.longitude,
          event.type
        );
        setWeatherData(suggestions);
        setShowWeatherSuggestions(true);
      } catch (error) {
        console.error('Error getting weather suggestions:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{EVENT_TYPES[event.type]?.icon}</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Date & Time
            </label>
            <p className="text-gray-800 dark:text-white">
              {moment(event.date).format('MMMM DD, YYYY [at] h:mm A')}
            </p>
          </div>

          {event.description && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Description
              </label>
              <p className="text-gray-800 dark:text-white">{event.description}</p>
            </div>
          )}

          {event.location && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Location
              </label>
              <p className="text-gray-800 dark:text-white">{event.location}</p>
            </div>
          )}

          {event.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Notes
              </label>
              <p className="text-gray-800 dark:text-white">{event.notes}</p>
            </div>
          )}

          {event.weatherSnapshot && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Weather at Event Time
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div>Temperature: {event.weatherSnapshot.temperature}°C</div>
                <div>Humidity: {event.weatherSnapshot.humidity}%</div>
                <div>Condition: {event.weatherSnapshot.condition}</div>
                <div>Wind: {event.weatherSnapshot.windSpeed} m/s</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              event.isCompleted 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            }`}>
              {event.isCompleted ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 mr-1" />
                  Pending
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGetWeatherSuggestions}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Cloud className="w-4 h-4" />
              Weather
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(event)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(event._id)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Weather Suggestions */}
        {showWeatherSuggestions && weatherData && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
              Weather Suggestions
            </h4>
            <div className="space-y-2">
              {weatherData.suggestions.warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  {warning}
                </div>
              ))}
              {weatherData.suggestions.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CalendarView;


