import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const EventsCalendar = ({ searchQuery }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const eventTypes = [
    { id: 'all', label: 'All Events', icon: '📅' },
    { id: 'farmerai', label: 'Your Events', icon: '🎯' },
    { id: 'community', label: 'Community Events', icon: '👥' },
    { id: 'official', label: 'Official Events', icon: '🏛️' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedType, currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      params.append('month', currentDate.getMonth() + 1);
      params.append('year', currentDate.getFullYear());

      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Mock data for demonstration
      setEvents([
        {
          _id: '1',
          title: 'Organic Farming Workshop',
          description: 'Learn about organic farming techniques and sustainable practices.',
          dateTime: '2024-01-20T09:00:00Z',
          endDateTime: '2024-01-20T17:00:00Z',
          location: 'Krishi Bhavan, Thrissur',
          category: 'workshop',
          type: 'official',
          organizer: 'Department of Agriculture',
          capacity: 50,
          registered: 23,
          price: 0,
          image: null
        },
        {
          _id: '2',
          title: 'FarmerAI App Training',
          description: 'Hands-on training session for using FarmerAI mobile application.',
          dateTime: '2024-01-22T10:00:00Z',
          endDateTime: '2024-01-22T12:00:00Z',
          location: 'Online - Zoom',
          category: 'training',
          type: 'farmerai',
          organizer: 'FarmerAI Team',
          capacity: 100,
          registered: 67,
          price: 0,
          image: null
        },
        {
          _id: '3',
          title: 'Kuttanad Farmers Meet',
          description: 'Monthly meetup for farmers in Kuttanad region to discuss challenges and solutions.',
          dateTime: '2024-01-25T14:00:00Z',
          endDateTime: '2024-01-25T16:00:00Z',
          location: 'Panchayat Hall, Kuttanad',
          category: 'meetup',
          type: 'community',
          organizer: 'Kuttanad Farmers Association',
          capacity: 30,
          registered: 18,
          price: 0,
          image: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'farmerai': return 'bg-blue-100 text-blue-800';
      case 'community': return 'bg-green-100 text-green-800';
      case 'official': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const EventCard = ({ event }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
              {eventTypes.find(t => t.id === event.type)?.icon} {eventTypes.find(t => t.id === event.type)?.label}
            </span>
            <span className="text-sm text-gray-500">{event.category}</span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {event.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">
            {event.description}
          </p>
        </div>
        
        {event.image && (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-20 h-20 object-cover rounded-lg ml-4"
          />
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>{formatDate(event.dateTime)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="w-4 h-4 mr-2" />
          <span>{formatTime(event.dateTime)} - {formatTime(event.endDateTime)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <MapPinIcon className="w-4 h-4 mr-2" />
          <span>{event.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <UsersIcon className="w-4 h-4 mr-2" />
          <span>{event.registered}/{event.capacity} registered</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Organized by: <span className="font-medium">{event.organizer}</span>
        </div>
        
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            View Details
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
            Register
          </button>
        </div>
      </div>
    </div>
  );

  const CalendarView = () => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const getEventsForDate = (date) => {
      return events.filter(event => {
        const eventDate = new Date(event.dateTime);
        return eventDate.toDateString() === date.toDateString();
      });
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === today.toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-gray-100 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isToday ? 'font-bold text-green-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Events Calendar</h2>
          <p className="text-gray-600 mt-1">Discover upcoming events, workshops, and meetups</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === 'list' 
                ? 'bg-green-100 text-green-800' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              viewMode === 'calendar' 
                ? 'bg-green-100 text-green-800' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {eventTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.id
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'No events scheduled for the selected period.'}
              </p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventsCalendar;
