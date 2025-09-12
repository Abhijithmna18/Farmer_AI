import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, Trash2, Eye, Edit } from 'lucide-react';
import { gsap } from 'gsap';

const CalendarTimeline = ({ calendars, onCalendarSelect, onDelete }) => {
  const [selectedStage, setSelectedStage] = useState(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) {
      gsap.fromTo(timelineRef.current.children, 
        { opacity: 0, x: -30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "power2.out"
        }
      );
    }
  }, [calendars]);

  const getStageColor = (stageName) => {
    const colors = {
      'Seed': 'bg-gray-100 text-gray-800',
      'Sprout': 'bg-green-100 text-green-800',
      'Seedling': 'bg-blue-100 text-blue-800',
      'Vegetative': 'bg-purple-100 text-purple-800',
      'Budding': 'bg-pink-100 text-pink-800',
      'Flowering': 'bg-yellow-100 text-yellow-800',
      'Ripening': 'bg-orange-100 text-orange-800',
      'Harvest': 'bg-red-100 text-red-800'
    };
    return colors[stageName] || 'bg-gray-100 text-gray-800';
  };

  const getStageIcon = (stageName) => {
    const icons = {
      'Seed': '🌱',
      'Sprout': '🌿',
      'Seedling': '🌱',
      'Vegetative': '🌿',
      'Budding': '🌺',
      'Flowering': '🌸',
      'Ripening': '🍅',
      'Harvest': '🌾'
    };
    return icons[stageName] || '🌱';
  };

  const calculateProgress = (calendar) => {
    if (!calendar.stages || calendar.stages.length === 0) return 0;
    
    const today = new Date();
    let completedStages = 0;
    
    calendar.stages.forEach(stage => {
      const endDate = new Date(stage.endDate);
      if (today > endDate) {
        completedStages++;
      }
    });
    
    return Math.round((completedStages / calendar.stages.length) * 100);
  };

  const getCurrentStage = (calendar) => {
    if (!calendar.stages || calendar.stages.length === 0) return null;
    
    const today = new Date();
    return calendar.stages.find(stage => {
      const startDate = new Date(stage.startDate);
      const endDate = new Date(stage.endDate);
      return today >= startDate && today <= endDate;
    });
  };

  if (calendars.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Calendars to Display
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first growth calendar to start tracking your crops.
        </p>
      </div>
    );
  }

  return (
    <div ref={timelineRef} className="space-y-6">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Growth Timeline
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {calendars.map((calendar, index) => {
          const progress = calculateProgress(calendar);
          const currentStage = getCurrentStage(calendar);
          const daysLeft = calendar.remainingDaysToHarvest;
          const calendarId = calendar._id || calendar.id;

          return (
            <div 
              key={calendarId}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 touch-pan-x"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {calendar.cropName}
                  </h3>
                  {calendar.variety && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {calendar.variety}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    Sown: {new Date(calendar.sowingDate || calendar.plantingDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onCalendarSelect(calendar)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(calendarId)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete Calendar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Growth Progress
                  </span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Stage */}
              {currentStage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getStageIcon(currentStage.stageName)}</span>
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Current Stage: {currentStage.stageName}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {currentStage.description || 'Growing well...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Harvest Countdown */}
              {daysLeft !== null && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {daysLeft <= 0 ? 'Ready for Harvest!' : `${daysLeft} days to harvest`}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Expected: {new Date(calendar.harvestDate || calendar.estimatedHarvestDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Growth Stages */}
              {calendar.stages && calendar.stages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Growth Stages
                  </h4>
                  <div className="flex flex-wrap gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 snap-x snap-mandatory">
                    {calendar.stages.map((stage, stageIndex) => (
                      <span
                        key={stageIndex}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(stage.stageName)} snap-start`}
                      >
                        <span className="mr-1">{getStageIcon(stage.stageName)}</span>
                        {stage.stageName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Tasks */}
              {calendar.upcomingTasks && calendar.upcomingTasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upcoming Tasks ({calendar.upcomingTasks.length})
                  </h4>
                  <div className="space-y-1">
                    {calendar.upcomingTasks.slice(0, 3).map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        {task.name}
                      </div>
                    ))}
                    {calendar.upcomingTasks.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        +{calendar.upcomingTasks.length - 3} more tasks
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Updated: {new Date(calendar.updatedAt || calendar.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/growth-calendar/${calendarId}`}
                    className="inline-flex items-center text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Manage
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarTimeline;


