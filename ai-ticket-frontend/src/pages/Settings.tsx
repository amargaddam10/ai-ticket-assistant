import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../store/store';
import { updateProfile, changePassword } from '../store/slices/authSlice';
import { updateSettings } from '../store/slices/settingsSlice';
import { toast } from 'react-hot-toast';

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    timezone: string;
    language: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    ticketUpdates: boolean;
    weeklyReports: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    activityTracking: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showAvatars: boolean;
  };
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'notifications' | 'privacy' | 'appearance' | 'security'
  >('profile');
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: '',
      email: '',
      phone: '',
      timezone: 'UTC',
      language: 'en',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      ticketUpdates: true,
      weeklyReports: true,
      securityAlerts: true,
    },
    privacy: {
      profileVisibility: 'public',
      activityTracking: true,
      dataSharing: false,
    },
    appearance: {
      theme: 'light',
      compactMode: false,
      showAvatars: true,
    },
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        profile: {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          timezone: user.timezone || 'UTC',
          language: user.language || 'en',
        },
      }));
    }
  }, [user]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save profile settings
      if (activeTab === 'profile') {
        await dispatch(updateProfile(settings.profile)).unwrap();
        toast.success('Profile updated successfully');
      }

      // Save other settings
      await dispatch(
        updateSettings({
          notifications: settings.notifications,
          privacy: settings.privacy,
          appearance: settings.appearance,
        })
      ).unwrap();

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();

      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'security', name: 'Security', icon: KeyIcon },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h3>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, name: e.target.value },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, email: e.target.value },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.profile.phone}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, phone: e.target.value },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </label>
                    <select
                      value={settings.profile.timezone}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            timezone: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Notification Preferences
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: 'Email Notifications',
                      description: 'Receive notifications via email',
                    },
                    {
                      key: 'pushNotifications',
                      label: 'Push Notifications',
                      description: 'Receive browser push notifications',
                    },
                    {
                      key: 'smsNotifications',
                      label: 'SMS Notifications',
                      description: 'Receive notifications via SMS',
                    },
                    {
                      key: 'ticketUpdates',
                      label: 'Ticket Updates',
                      description: 'Get notified when tickets are updated',
                    },
                    {
                      key: 'weeklyReports',
                      label: 'Weekly Reports',
                      description: 'Receive weekly summary reports',
                    },
                    {
                      key: 'securityAlerts',
                      label: 'Security Alerts',
                      description: 'Important security notifications',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.notifications[
                              item.key as keyof typeof settings.notifications
                            ]
                          }
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Privacy Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            profileVisibility: e.target.value as
                              | 'public'
                              | 'private',
                          },
                        }))
                      }
                      className="block w-full max-w-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  {[
                    {
                      key: 'activityTracking',
                      label: 'Activity Tracking',
                      description:
                        'Allow tracking of your activity for analytics',
                    },
                    {
                      key: 'dataSharing',
                      label: 'Data Sharing',
                      description:
                        'Share anonymized data to improve the service',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.privacy[
                              item.key as keyof typeof settings.privacy
                            ]
                          }
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Appearance Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          appearance: {
                            ...prev.appearance,
                            theme: e.target.value as 'light' | 'dark' | 'auto',
                          },
                        }))
                      }
                      className="block w-full max-w-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>

                  {[
                    {
                      key: 'compactMode',
                      label: 'Compact Mode',
                      description: 'Use a more compact interface design',
                    },
                    {
                      key: 'showAvatars',
                      label: 'Show Avatars',
                      description:
                        'Display user avatars throughout the interface',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            settings.appearance[
                              item.key as keyof typeof settings.appearance
                            ]
                          }
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              appearance: {
                                ...prev.appearance,
                                [item.key]: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Change Password
                </h3>

                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={
                      saving ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          {activeTab !== 'security' && (
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
