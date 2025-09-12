import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { gsap } from 'gsap';

const HarvestCountdown = ({ calendars }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "back.out(1.7)"
        }
      );
    }
  }, [calendars]);

  const getUrgentCalendars = () => {
    return calendars.filter(calendar => {
      const daysLeft = calendar.remainingDaysToHarvest;
      return daysLeft !== null && daysLeft <= 7;
    }).sort((a, b) => a.remainingDaysToHarvest - b.remainingDaysToHarvest);
  };

  const formatTimeRemaining = (daysLeft) => {
    if (daysLeft <= 0) {
      return { text: 'Ready for Harvest!', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle };
    } else if (daysLeft <= 1) {
      return { text: 'Tomorrow!', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
    } else if (daysLeft <= 3) {
      return { text: `${daysLeft} days left`, color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle };
    } else {
      return { text: `${daysLeft} days left`, color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock };
    }
  };

  const urgentCalendars = getUrgentCalendars();

  if (urgentCalendars.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center text-center">
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-xl mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All Harvests On Track
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No urgent harvests in the next 7 days. Your crops are growing well!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex items-center mb-4">
        <Calendar className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Harvest Countdown
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {urgentCalendars.map((calendar, index) => {
          const timeInfo = formatTimeRemaining(calendar.remainingDaysToHarvest);
          const IconComponent = timeInfo.icon;
          const harvestDate = new Date(calendar.harvestDate).toLocaleDateString();

          return (
            <div 
              key={calendar._id || calendar.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
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
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Expected: {harvestDate}
                  </p>
                </div>
                <div className={`p-3 ${timeInfo.bgColor} dark:bg-opacity-20 rounded-xl`}>
                  <IconComponent className={`h-6 w-6 ${timeInfo.color} dark:text-current`} />
                </div>
              </div>

              <div className="space-y-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${timeInfo.bgColor} ${timeInfo.color} dark:bg-opacity-20`}>
                  <Clock className="h-4 w-4 mr-1" />
                  {timeInfo.text}
                </div>

                {calendar.currentStage && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Current Stage:</span> {calendar.currentStage.stageName}
                  </div>
                )}

                {calendar.upcomingTasks && calendar.upcomingTasks.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Upcoming Tasks:</span> {calendar.upcomingTasks.length}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(calendar.updatedAt || calendar.createdAt).toLocaleDateString()}
                  </span>
                  <button className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestCountdown;


