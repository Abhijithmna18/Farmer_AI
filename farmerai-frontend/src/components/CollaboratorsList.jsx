import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';

const CollaboratorsList = ({ collaborators, onInvite }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Collaborators</h2>
        <button
          onClick={() => onInvite('', 'viewer')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Invite
        </button>
      </div>
      
      <div className="grid gap-4">
        {collaborators.map((collaborator) => (
          <motion.div
            key={collaborator._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {collaborator.user?.firstName && collaborator.user?.lastName ? `${collaborator.user.firstName} ${collaborator.user.lastName}` : collaborator.user?.name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {collaborator.user?.email} • {collaborator.role}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                collaborator.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                collaborator.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {collaborator.role}
              </span>
            </div>
          </motion.div>
        ))}
        
        {collaborators.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No collaborators yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Invite team members to collaborate on this calendar
            </p>
            <button
              onClick={() => onInvite('', 'viewer')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Invite Collaborator
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorsList;


