import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Mail, 
  MapPin, 
  Calendar,
  Sprout,
  User,
  Phone,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import Toast from '../Toast';
import apiClient from '../../services/apiClient';

const PendingFarmers = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/community/admin/join-requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setToast({ type: 'error', message: 'Failed to load pending requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await apiClient.put(`/community/admin/join-requests/${requestId}/approve`);
      setToast({ type: 'success', message: 'Join request approved successfully. Welcome email sent.' });
      loadPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setToast({ type: 'error', message: 'Failed to approve request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await apiClient.put(`/community/admin/join-requests/${requestId}/reject`, {
        rejectionReason
      });
      setToast({ type: 'success', message: 'Join request rejected successfully' });
      setShowRejectModal(false);
      setRejectionReason('');
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setToast({ type: 'error', message: 'Failed to reject request' });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pending Farmers</h2>
          <p className="text-gray-600 mt-1">Review and approve farmer join requests</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-5 h-5" />
          <span>{requests.length} pending requests</span>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No pending requests</h3>
          <p className="text-gray-500">All join requests have been processed</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Profile Photo */}
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {request.profilePhoto ? (
                      <img
                        src={`http://localhost:5000/${request.profilePhoto}`}
                        alt={request.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Request Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{request.fullName}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pending
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{request.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{request.district}, {request.state}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{request.yearsOfExperience} years experience</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Sprout className="w-4 h-4" />
                        <span>{request.crops.length} crops</span>
                      </div>
                    </div>

                    {/* Crops */}
                    {request.crops.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {request.crops.map((crop, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                            >
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submitted Date */}
                    <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Submitted {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openDetailsModal(request)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleApprove(request._id)}
                    disabled={processingId === request._id}
                    className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                  >
                    {processingId === request._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => openRejectModal(request)}
                    className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Farmer Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {selectedRequest.profilePhoto ? (
                      <img
                        src={`http://localhost:5000/${selectedRequest.profilePhoto}`}
                        alt={selectedRequest.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-800">{selectedRequest.fullName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-800">{selectedRequest.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-800">{selectedRequest.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-800">{selectedRequest.district}, {selectedRequest.state}</p>
                    </div>
                  </div>
                </div>

                {/* Farming Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Farming Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Years of Experience</label>
                      <p className="text-gray-800">{selectedRequest.yearsOfExperience} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Crops Grown</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequest.crops.map((crop, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedRequest.bio && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Bio</h4>
                    <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{selectedRequest.bio}</p>
                  </div>
                )}

                {/* Submission Info */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Submission Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Submitted On</label>
                      <p className="text-gray-800">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Status</label>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    openRejectModal(selectedRequest);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleApprove(selectedRequest._id);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Reject Join Request</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to reject <strong>{selectedRequest.fullName}</strong>'s join request?
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                  placeholder="Provide a reason for rejection..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  disabled={processingId === selectedRequest._id}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                >
                  {processingId === selectedRequest._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Reject Request</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default PendingFarmers;
