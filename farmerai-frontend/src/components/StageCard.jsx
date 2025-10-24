import React from 'react';
import { Leaf, Droplets, Syringe, Wind } from 'lucide-react';

/**
 * A card component with a glassmorphism and claymorphism-inspired design 
 * to display a single growth stage.
 */
const StageCard = ({ stage, isActive }) => {
  if (!stage) return null;

  const cardStyle = {
    borderRadius: '20px',
    background: isActive 
      ? 'rgba(255, 255, 255, 0.4)' 
      : 'rgba(255, 255, 255, 0.61)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: isActive
      ? 'inset -5px -5px 10px rgba(255, 255, 255, 0.5), inset 5px 5px 10px rgba(0, 0, 0, 0.1), 10px 10px 20px rgba(0, 0, 0, 0.1)'
      : '10px 10px 20px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease-in-out',
    transform: isActive ? 'translateY(-10px)' : 'translateY(0)',
  };

  // Dark mode adjustments
  const darkModeStyle = {
    background: isActive 
      ? 'rgba(30, 41, 59, 0.4)' 
      : 'rgba(30, 41, 59, 0.61)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  };

  return (
    <div 
      style={cardStyle} 
      className="p-6 text-gray-800 dark:text-gray-200"
    >
      <h3 className="text-2xl font-bold mb-3 text-green-800 dark:text-green-300">{stage.stageName}</h3>
      
      <p className="text-sm mb-4 font-light italic">
        {new Date(stage.startDate).toLocaleDateString()} - {new Date(stage.endDate).toLocaleDateString()}
      </p>

      <p className="mb-4">{stage.description || 'No description for this stage.'}</p>

      <div className="space-y-3">
        {stage.careNeeds && (
          <div className="flex items-start">
            <Droplets className="h-5 w-5 mr-3 mt-1 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Care Needs</h4>
              <p className="text-sm">{stage.careNeeds}</p>
            </div>
          </div>
        )}
        {stage.nutrientRequirements && (
          <div className="flex items-start">
            <Leaf className="h-5 w-5 mr-3 mt-1 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">Nutrient Requirements</h4>
              <p className="text-sm">{stage.nutrientRequirements}</p>
            </div>
          </div>
        )}
      </div>

      {stage.tasks && stage.tasks.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-lg mb-2">Tasks</h4>
          <ul className="list-disc list-inside space-y-1">
            {stage.tasks.map(task => (
              <li key={task._id} className={task.isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}>
                {task.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StageCard;