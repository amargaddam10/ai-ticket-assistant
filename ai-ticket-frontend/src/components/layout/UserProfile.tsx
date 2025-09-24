import React from 'react';

const UserProfile: React.FC = () => {
  return (
    <div className="p-4 border-t dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <img
          src="https://via.placeholder.com/40"
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            John Doe
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
