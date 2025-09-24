import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full h-16 bg-white dark:bg-gray-900 shadow flex items-center justify-between px-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
        Dashboard
      </h1>
      <div className="flex items-center space-x-4">
        {/* Future: Notifications, Profile Menu */}
        <span className="text-gray-600 dark:text-gray-300">User</span>
      </div>
    </header>
  );
};

export default Header;
