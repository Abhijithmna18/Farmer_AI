import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { gsap } from 'gsap';
import { updateTaskCompletion, addTaskToStage } from '../../services/calendarService';

const TaskManager = ({ calendars }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ name: '', description: '', scheduledDate: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Flatten all tasks from all calendars
    const allTasks = [];
    calendars.forEach(calendar => {
      if (calendar.upcomingTasks) {
        calendar.upcomingTasks.forEach(task => {
          allTasks.push({
            ...task,
            calendarId: calendar._id || calendar.id,
            calendarName: calendar.cropName
          });
        });
      }
    });
    
    // Sort by date
    allTasks.sort((a, b) => {
      const dateA = new Date(a.scheduledDate || a.date);
      const dateB = new Date(b.scheduledDate || b.date);
      return dateA - dateB;
    });
    
    setTasks(allTasks);
  }, [calendars]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          stagger: 0.1, 
          ease: "power2.out"
        }
      );
    }
  }, [tasks]);

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600 bg-red-100 dark:bg-red-900/20',
      'medium': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      'low': 'text-green-600 bg-green-100 dark:bg-green-900/20'
    };
    return colors[priority] || colors['medium'];
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      'high': AlertTriangle,
      'medium': Clock,
      'low': CheckCircle
    };
    return icons[priority] || Clock;
  };

  const getTaskStatus = (task) => {
    const today = new Date();
    const taskDate = new Date(task.scheduledDate || task.date);
    const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
    
    if (task.isCompleted) {
      return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    } else if (diffDays < 0) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    } else if (diffDays === 0) {
      return { status: 'today', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    } else {
      return { status: 'upcoming', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    }
  };

  const handleTaskCompletion = async (task, isCompleted) => {
    try {
      setLoading(true);
      await updateTaskCompletion(task.calendarId, task.stageName, task._id, { isCompleted });
      
      // Update local state
      setTasks(prev => prev.map(t => 
        t._id === task._id ? { ...t, isCompleted, completedAt: isCompleted ? new Date() : null } : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedCalendar || !selectedStage || !newTask.name) return;

    try {
      setLoading(true);
      await addTaskToStage(selectedCalendar._id || selectedCalendar.id, selectedStage.stageName, newTask);
      
      // Reset form
      setNewTask({ name: '', description: '', scheduledDate: '', priority: 'medium' });
      setShowAddTask(false);
      
      // Refresh tasks (in a real app, you'd refetch from API)
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedTasks = tasks.reduce((groups, task) => {
    const status = getTaskStatus(task).status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(task);
    return groups;
  }, {});

  const statusOrder = ['overdue', 'today', 'soon', 'upcoming', 'completed'];
  const statusLabels = {
    'overdue': 'Overdue',
    'today': 'Due Today',
    'soon': 'Due Soon',
    'upcoming': 'Upcoming',
    'completed': 'Completed'
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Tasks Scheduled
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          All your crops are growing well! Add tasks to track important activities.
        </p>
        <button
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Task Manager
          </h2>
        </div>
        
        <button
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {statusOrder.map(status => {
          const statusTasks = groupedTasks[status] || [];
          if (statusTasks.length === 0) return null;

          const statusInfo = getTaskStatus(statusTasks[0]);
          
          return (
            <div key={status} className="space-y-3">
              <h3 className={`text-lg font-semibold ${statusInfo.color}`}>
                {statusLabels[status]} ({statusTasks.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusTasks.map((task, index) => {
                  const PriorityIcon = getPriorityIcon(task.priority);
                  const taskDate = new Date(task.scheduledDate || task.date);
                  
                  return (
                    <div 
                      key={`${task._id}-${index}`}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 ${statusInfo.bgColor}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {task.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {task.calendarName} • {task.stageName}
                          </p>
                          {task.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            <PriorityIcon className="h-3 w-3 mr-1" />
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {taskDate.toLocaleDateString()}
                        </div>
                        
                        {!task.isCompleted && (
                          <button
                            onClick={() => handleTaskCompletion(task, true)}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                        )}
                        
                        {task.isCompleted && (
                          <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Task
            </h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Calendar
                </label>
                <select
                  value={selectedCalendar?._id || ''}
                  onChange={(e) => {
                    const calendar = calendars.find(c => (c._id || c.id) === e.target.value);
                    setSelectedCalendar(calendar);
                    setSelectedStage(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Calendar</option>
                  {calendars.map(calendar => (
                    <option key={calendar._id || calendar.id} value={calendar._id || calendar.id}>
                      {calendar.cropName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCalendar && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stage
                  </label>
                  <select
                    value={selectedStage?.stageName || ''}
                    onChange={(e) => {
                      const stage = selectedCalendar.stages?.find(s => s.stageName === e.target.value);
                      setSelectedStage(stage);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Stage</option>
                    {selectedCalendar.stages?.map(stage => (
                      <option key={stage.stageName} value={stage.stageName}>
                        {stage.stageName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={newTask.scheduledDate}
                  onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;


