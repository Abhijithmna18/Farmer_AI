import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Edit, Trash2 } from 'lucide-react';

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

const EventsList = ({ events, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Events</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {events.length} total events
        </div>
      </div>
      
      <div className="grid gap-4">
        {events.map((event) => (
          <motion.div
            key={event._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: EVENT_TYPES[event.type]?.color }}
                />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {EVENT_TYPES[event.type]?.icon} {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString()} • {event.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <button
                  onClick={() => onEdit(event._id, { isCompleted: !event.isCompleted })}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(event._id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {event.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {event.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EventsList;


