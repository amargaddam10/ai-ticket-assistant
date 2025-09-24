import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  UserIcon,
  BellIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from '@/components/ui/ThemeToggle';

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    // {
    //   id: 'profile',
    //   name: 'Profile',
    //   icon: UserIcon,
    // },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: PaintBrushIcon,
    },
    {
      id: 'security',
      name: 'Security',
      icon: ShieldCheckIcon,
    },
    {
      id: 'preferences',
      name: 'Preferences',
      icon: CogIcon,
    },
  ];

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-6">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                      ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Appearance
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Customize how the application looks and feels.
                    </p>
                  </div>

                  <ThemeToggle />

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveSettings}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Update your profile information and contact details.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveSettings}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notification Preferences
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose when and how you want to be notified.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      'Email notifications for new ticket assignments',
                      'Browser notifications for urgent tickets',
                      'Weekly summary reports',
                      'System maintenance updates',
                    ].map((notification, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={index < 2}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {notification}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSaveSettings}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {!['appearance', 'profile', 'notifications'].includes(
              activeTab
            ) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {tabs.find((tab) => tab.id === activeTab)?.name} Settings
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    This section is coming soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
