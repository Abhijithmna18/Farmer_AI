import React, { useState, useEffect } from 'react';
import { getGrowthCalendars, deleteGrowthCalendar } from '../services/calendarService';
import PageHeader from '../components/PageHeader';
import ProgressRing from '../components/growth-calendar/ProgressRing';
import { Link } from 'react-router-dom'; // Assuming you use React Router for navigation
import { PlusCircle } from 'lucide-react';

const GrowthCalendar = () => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        setLoading(true);
        const data = await getGrowthCalendars();
        setCalendars(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch growth calendars');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, []);

  const handleDelete = async (id) => {
    if (!id) {
      setError('Cannot delete calendar: missing id');
      return;
    }

    if (window.confirm('Are you sure you want to delete this calendar?')) {
      try {
        await deleteGrowthCalendar(id);
        setCalendars(prev => prev.filter((cal) => (cal._id || cal.id) !== id));
        setError(null);
        // Add a toast notification here in a real app
      } catch (err) {
        setError(err.message || 'Failed to delete calendar');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <PageHeader 
        title="Growth Calendars"
        subtitle="Track and manage your crop growth cycles" 
      />
      
      <div className="flex justify-end mb-4">
        {/* Link to a new page to create a calendar, or open a modal */}
        <Link to="/growth-calendar/new" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <PlusCircle className="h-5 w-5 mr-2" />
          Create New Calendar
        </Link>
      </div>

      {loading && <p>Loading calendars...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calendars.length > 0 ? (
            calendars.map((calendar, idx) => {
              const keyId = calendar?._id ?? calendar?.id ?? idx;
              const deleteId = calendar?._id ?? calendar?.id ?? null; // only use real ids for deletion
              return (
                <div key={String(keyId)} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-transparent dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{calendar.cropName}</h3>
                      {calendar.variety && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{calendar.variety}</p>}
                    </div>
                    {Array.isArray(calendar.stages) && calendar.stages.length > 0 && (
                      <ProgressRing 
                        progress={Math.round((calendar.stages.filter(s => new Date(s.endDate) < new Date()).length / calendar.stages.length) * 100)}
                      />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Sowing: {(calendar.sowingDate || calendar.plantingDate) ? new Date(calendar.sowingDate || calendar.plantingDate).toLocaleDateString() : '—'}
                  </p>
                  {(calendar.harvestDate || calendar.estimatedHarvestDate) && (
                    <p className="text-gray-600 dark:text-gray-300">
                      Harvest: {new Date(calendar.harvestDate || calendar.estimatedHarvestDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <Link to={`/growth-calendar/${String(keyId)}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">View</Link>
                    <button
                      onClick={() => {
                        if (!deleteId) {
                          setError('Cannot delete this calendar: missing id');
                          return;
                        }
                        handleDelete(deleteId);
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No growth calendars found. Get started by creating one!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GrowthCalendar;
