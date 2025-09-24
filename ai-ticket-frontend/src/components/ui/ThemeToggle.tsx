import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import {
  SunIcon as SunSolid,
  MoonIcon as MoonSolid,
  ComputerDesktopIcon as ComputerSolid,
} from '@heroicons/react/24/solid';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    {
      name: 'Light',
      value: 'light' as const,
      icon: SunIcon,
      iconSolid: SunSolid,
      description: 'Light theme',
    },
    {
      name: 'Dark',
      value: 'dark' as const,
      icon: MoonIcon,
      iconSolid: MoonSolid,
      description: 'Dark theme',
    },
    {
      name: 'System',
      value: 'system' as const,
      icon: ComputerDesktopIcon,
      iconSolid: ComputerSolid,
      description: 'Follow system preference',
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Theme Preference
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose your preferred theme or follow your system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {themes.map((themeOption) => {
          const isSelected = theme === themeOption.value;
          const Icon = isSelected ? themeOption.iconSolid : themeOption.icon;

          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                relative flex items-center space-x-3 rounded-lg border px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{themeOption.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {themeOption.description}
                </p>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1">
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
        <span>Currently using:</span>
        <span className="font-medium capitalize">
          {resolvedTheme} theme
          {theme === 'system' && ` (system preference)`}
        </span>
      </div>
    </div>
  );
};

export default ThemeToggle;
