import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getGrowthCalendarById,
  addCropEvent,
  updateCropEvent,
  deleteCropEvent,
  getCalendarAnalytics,
  getWeatherSuggestions,
  generateAISchedule,
  predictYield,
} from '../services/calendarService';
import PageHeader from '../components/PageHeader';
import StageCard from '../components/StageCard';
import CalendarView from '../components/CalendarView';
import CalendarAnalytics from '../components/CalendarAnalytics';
import { ArrowLeft } from 'lucide-react';
import { gsap } from 'gsap';
import { createTask } from '../services/taskService';
import { createReminder } from '../services/reminderService';
import { toast } from 'react-hot-toast';

const GrowthCalendarDetail = () => {
  const { id } = useParams();
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [aiBanner, setAiBanner] = useState(null);

  const timelineRef = useRef(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setLoading(true);
        const data = await getGrowthCalendarById(id);
        setCalendar(data);
        
        // Determine active stage
        const today = new Date();
        const activeStageIndex = data.stages.findIndex(stage => {
          const startDate = new Date(stage.startDate);
          const endDate = new Date(stage.endDate);
          return today >= startDate && today <= endDate;
        });
        setActiveIndex(activeStageIndex !== -1 ? activeStageIndex : 0);

        // Load analytics
        try {
          const a = await getCalendarAnalytics(id);
          setAnalytics(a);
        } catch (_) {}

        // AI: generate schedule suggestion banner if missing events
        if (!data.cropEvents || data.cropEvents.length === 0) {
          try {
            const schedule = await generateAISchedule({
              cropName: data.cropName,
              soilType: data?.location?.soilType || 'loam',
              region: data?.regionalClimate || 'temperate',
              plantingDate: data.plantingDate,
            });
            setAiBanner({
              message: `AI generated a recommended schedule with ${schedule?.schedule?.length || 0} tasks. Click to apply.`,
              schedule,
            });
          } catch (_) {}
        }

      } catch (err) {
        setError(err.message || 'Failed to fetch calendar details');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [id]);

  useEffect(() => {
    if (!loading && calendar) {
      gsap.fromTo(timelineRef.current.children, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading, calendar]);

  if (loading) return <p>Loading calendar details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!calendar) return <p>No calendar data found.</p>;

  return (
    <div className="container mx-auto p-4 md:p-6 bg-green-50 dark:bg-gray-900 min-h-screen">
      <Link to="/growth-calendar" className="inline-flex items-center gap-2 text-green-700 dark:text-green-300 hover:underline mb-4">
        <ArrowLeft size={20} />
        Back to All Calendars
      </Link>

      <PageHeader 
        title={calendar.cropName}
        subtitle={`Variety: ${calendar.variety || 'N/A'} | Planted on ${new Date(calendar.plantingDate).toLocaleDateString()}${calendar.transplantDate ? ` | Transplanted on ${new Date(calendar.transplantDate).toLocaleDateString()}` : ''}`}
      />

      {/* AI Suggestion Banner */}
      {aiBanner && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-emerald-800 text-sm font-medium">{aiBanner.message}</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                onClick={async () => {
                  try {
                    const tasks = aiBanner.schedule?.schedule || [];
                    // Bulk apply: sequentially add events
                    for (const ev of tasks) {
                      const created = await addCropEvent(calendar._id, {
                        ...ev,
                        date: ev.date,
                        title: ev.title || ev.type,
                      });
                      // Update local state
                      setCalendar(prev => ({ ...prev, cropEvents: [...(prev.cropEvents || []), created] }));
                    }
                    // Update estimated harvest if provided
                    if (aiBanner.schedule?.estimatedHarvestDate) {
                      setCalendar(prev => ({ ...prev, estimatedHarvestDate: aiBanner.schedule.estimatedHarvestDate }));
                    }
                    setAiBanner(null);
                    toast.success('AI schedule applied');
                  } catch (err) {
                    toast.error(err?.message || 'Failed to apply AI schedule');
                  }
                }}
              >
                Apply
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm" onClick={() => setAiBanner(null)}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-300">Growth Timeline</h2>
        <div ref={timelineRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {calendar.stages.map((stage, index) => (
            <StageCard key={stage._id || index} stage={stage} isActive={index === activeIndex} />
          ))}
        </div>
      </div>

      {/* Interactive Calendar */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Calendar</h3>
        <CalendarView
          calendar={calendar}
          onAddEvent={async (event) => {
            try {
              const created = await addCropEvent(calendar._id, event);
              setCalendar(prev => ({ ...prev, cropEvents: [...(prev.cropEvents || []), created] }));
              toast.success('Event added');
            } catch (err) {
              toast.error(err?.message || 'Failed to add event');
            }
          }}
          onEditEvent={async (event) => {
            try {
              const updated = await updateCropEvent(calendar._id, event._id, event);
              setCalendar(prev => ({
                ...prev,
                cropEvents: (prev.cropEvents || []).map(e => (e._id === updated._id ? updated : e))
              }));
              toast.success('Event updated');
            } catch (err) {
              toast.error(err?.message || 'Failed to update event');
            }
          }}
          onDeleteEvent={async (eventId) => {
            try {
              await deleteCropEvent(calendar._id, eventId);
              setCalendar(prev => ({
                ...prev,
                cropEvents: (prev.cropEvents || []).filter(e => e._id !== eventId)
              }));
              toast.success('Event deleted');
            } catch (err) {
              toast.error(err?.message || 'Failed to delete event');
            }
          }}
          onExport={() => toast('Export coming soon')}
          onImport={() => toast('Import coming soon')}
          onInviteCollaborator={() => toast('Invite coming soon')}
          onViewAnalytics={async () => {
            try {
              const a = await getCalendarAnalytics(calendar._id);
              setAnalytics(a);
            } catch (err) {
              toast.error(err?.message || 'Failed to load analytics');
            }
          }}
          onGetWeatherSuggestions={async (lat, lon, type) => {
            try {
              const res = await getWeatherSuggestions(lat, lon, type);
              return res;
            } catch (err) {
              toast.error(err?.message || 'Failed to get weather');
              return null;
            }
          }}
        />
      </div>

      {/* Analytics */}
      <div className="mt-12">
        <CalendarAnalytics
          calendarId={calendar._id}
          analytics={analytics}
          onRefresh={async () => {
            const a = await getCalendarAnalytics(calendar._id);
            setAnalytics(a);
          }}
        />
      </div>

      {/* Placeholder for adding/editing tasks, harvest records etc. */}
      <div className="mt-12 text-center">
        <div className="inline-flex gap-3">
          <button
            onClick={async () => {
              // Quick prompt-based task creation for now
              const title = window.prompt('Task title');
              if (!title) return;
              const description = window.prompt('Task description (optional)') || '';
              const payload = { calendarId: calendar._id, title, description };
              try {
                const newTask = await createTask(payload);
                // Update local calendar state: append to top-level customReminders or stages
                // We don't know where backend stores tasks; append to calendar.customReminders for UI
                setCalendar(prev => ({ ...prev, customReminders: [...(prev.customReminders||[]), newTask] }));
                toast.success('Task created');
              } catch (err) {
                console.error(err);
                toast.error(err?.message || 'Failed to create task');
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Task
          </button>

          <button
            onClick={async () => {
              const title = window.prompt('Reminder title');
              if (!title) return;
              const date = window.prompt('Reminder date (YYYY-MM-DD)');
              if (!date) return;
              const payload = { calendarId: calendar._id, title, date };
              try {
                const newReminder = await createReminder(payload);
                setCalendar(prev => ({ ...prev, customReminders: [...(prev.customReminders||[]), newReminder] }));
                toast.success('Reminder created');
              } catch (err) {
                console.error(err);
                toast.error(err?.message || 'Failed to create reminder');
              }
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrowthCalendarDetail;
