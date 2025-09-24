import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/store';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: any) => Promise<void>;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get user info from store
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🎫 Modal form submitted');

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    setLoading(true);

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      console.log('🎫 Calling onSubmit with:', ticketData);
      await onSubmit(ticketData);

      // Reset form on success
      setFormData({
        title: '',
        description: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
      });
      setErrors({});
      onClose();
    }
  };

  // FIXED: Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* FIXED: Backdrop with proper click handling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
            onClick={handleBackdropClick}
          >
            {/* Dark overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

            {/* FIXED: Modal content with proper event handling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click
            >
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Create New Support Ticket
                    </h3>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 p-1"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Title Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Issue Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          if (errors.title) {
                            setErrors({ ...errors, title: '' });
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors ${
                          errors.title
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Brief summary of your issue"
                        maxLength={100}
                        disabled={loading}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.title}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.title.length}/100 characters
                      </p>
                    </div>

                    {/* Description Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Detailed Description{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          });
                          if (errors.description) {
                            setErrors({ ...errors, description: '' });
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none ${
                          errors.description
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Please describe your issue in detail..."
                        maxLength={500}
                        disabled={loading}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.title.trim() ||
                      !formData.description.trim()
                    }
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Ticket'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTicketModal;
