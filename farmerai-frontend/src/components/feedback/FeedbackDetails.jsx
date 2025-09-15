import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Calendar,
  User,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';

const FeedbackDetails = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const getTypeIcon = (type) => {
    const icons = {
      'Bug Report': Bug,
      'Feature Suggestion': Lightbulb,
      'General Comment': MessageSquare
    };
    return icons[type] || MessageSquare;
  };

  const getTypeColor = (type) => {
    const colors = {
      'Bug Report': 'text-red-600 bg-red-100',
      'Feature Suggestion': 'text-yellow-600 bg-yellow-100',
      'General Comment': 'text-blue-600 bg-blue-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Received': Clock,
      'In Progress': AlertCircle,
      'Completed': CheckCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Received': 'text-yellow-600 bg-yellow-100',
      'In Progress': 'text-blue-600 bg-blue-100',
      'Completed': 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-gray-600 bg-gray-100',
      'Medium': 'text-yellow-600 bg-yellow-100',
      'High': 'text-orange-600 bg-orange-100',
      'Critical': 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TypeIcon = getTypeIcon(feedback.type);
  const StatusIcon = getStatusIcon(feedback.status);

  const handleDownloadAttachment = () => {
    if (feedback.attachment) {
      const link = document.createElement('a');
      link.href = `http://localhost:5000/${feedback.attachment}`;
      link.download = feedback.attachment.split('/').pop();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${getTypeColor(feedback.type)}`}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{feedback.subject}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="capitalize">{feedback.type}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority} Priority
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
                </div>
              </div>

              {/* Attachment */}
              {feedback.attachment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Attachment</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-800">
                            {feedback.attachment.split('/').pop()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Click to download or view
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleDownloadAttachment}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <a
                          href={`http://localhost:5000/${feedback.attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Comment */}
              {feedback.adminComment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Admin Response</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Admin Team</span>
                    </div>
                    <p className="text-blue-700 whitespace-pre-wrap">{feedback.adminComment}</p>
                  </div>
                </div>
              )}

              {/* Farmer Comment */}
              {feedback.farmerComment && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Your Additional Comment</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{feedback.farmerComment}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Status</h4>
                <div className="flex items-center space-x-2">
                  <StatusIcon className="w-5 h-5" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(feedback.status)}`}>
                    {feedback.status}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Submitted</p>
                      <p className="text-xs text-gray-600">{formatDate(feedback.createdAt)}</p>
                    </div>
                  </div>
                  
                  {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Last Updated</p>
                        <p className="text-xs text-gray-600">{formatDate(feedback.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {feedback.resolvedAt && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Resolved</p>
                        <p className="text-xs text-gray-600">{formatDate(feedback.resolvedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned To */}
              {feedback.assignedTo && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Assigned To</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{feedback.assignedTo.name}</p>
                      <p className="text-xs text-gray-600">{feedback.assignedTo.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes (if visible to user) */}
              {feedback.adminNotes && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Internal Notes</h4>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">{feedback.adminNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackDetails;



