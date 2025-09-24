import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  UserIcon,
  TagIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface TicketBulkActionsProps {
  selectedTickets: string[];
  onStatusUpdate: (ticketIds: string[], status: string) => void;
  onPriorityUpdate: (ticketIds: string[], priority: string) => void;
  onAssignUpdate: (ticketIds: string[], assignedTo: string) => void;
  onTagsUpdate: (ticketIds: string[], tags: string[]) => void;
  onDelete: (ticketIds: string[]) => void;
  onExport: (ticketIds: string[]) => void;
  onClearSelection: () => void;
  users?: User[];
  availableTags?: string[];
  className?: string;
}

const TicketBulkActions: React.FC<TicketBulkActionsProps> = ({
  selectedTickets,
  onStatusUpdate,
  onPriorityUpdate,
  onAssignUpdate,
  onTagsUpdate,
  onDelete,
  onExport,
  onClearSelection,
  users = [],
  availableTags = [],
  className = '',
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  if (selectedTickets.length === 0) return null;

  const handleStatusChange = (status: string) => {
    onStatusUpdate(selectedTickets, status);
    setShowDropdown(false);
  };

  const handlePriorityChange = (priority: string) => {
    onPriorityUpdate(selectedTickets, priority);
    setShowDropdown(false);
  };

  const handleAssign = () => {
    if (selectedUser) {
      onAssignUpdate(selectedTickets, selectedUser);
      setShowAssignModal(false);
      setSelectedUser('');
    }
  };

  const handleTagsUpdate = () => {
    const tagsToUpdate = [...selectedTags];
    if (customTag.trim()) {
      tagsToUpdate.push(customTag.trim());
    }
    onTagsUpdate(selectedTickets, tagsToUpdate);
    setShowTagsModal(false);
    setSelectedTags([]);
    setCustomTag('');
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedTickets.length} ticket(s)?`
      )
    ) {
      onDelete(selectedTickets);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 ${className}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedTickets.length} selected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Status Update */}
              <div className="relative">
                <select
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Update Status
                  </option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Priority Update */}
              <div className="relative">
                <select
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Update Priority
                  </option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assign Button */}
              <button
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <UserIcon className="h-4 w-4 mr-1" />
                Assign
              </button>

              {/* Tags Button */}
              <button
                onClick={() => setShowTagsModal(true)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <TagIcon className="h-4 w-4 mr-1" />
                Tags
              </button>

              {/* More Actions */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onExport(selectedTickets);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Export Selected
                        </button>
                        <button
                          onClick={() => {
                            handleDelete();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Selected
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              onClick={onClearSelection}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowAssignModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              >
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Assign Tickets
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {users.map((user) => (
                      <label key={user._id} className="flex items-center">
                        <input
                          type="radio"
                          name="assignUser"
                          value={user._id}
                          checked={selectedUser === user._id}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email} • {user.role}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleAssign}
                    disabled={!selectedUser}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Tags Modal */}
      <AnimatePresence>
        {showTagsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowTagsModal(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              >
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Add Tags
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Available Tags
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {availableTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                              selectedTags.includes(tag)
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Custom Tag
                      </label>
                      <input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        placeholder="Enter custom tag"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleTagsUpdate}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Add Tags
                  </button>
                  <button
                    onClick={() => setShowTagsModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TicketBulkActions;
