import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';

interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Home
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/',
      current: pathnames.length === 0,
    });

    // Generate breadcrumbs based on path
    let currentPath = '';

    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      const isLast = index === pathnames.length - 1;

      let name = pathname.charAt(0).toUpperCase() + pathname.slice(1);

      // Custom names for specific routes
      switch (pathname) {
        case 'admin':
          name = 'Admin Panel';
          break;
        case 'analytics':
          name = 'Analytics';
          break;
        case 'reports':
          name = 'Reports';
          break;
        case 'settings':
          name = 'Settings';
          break;
        case 'profile':
          name = 'Profile';
          break;
        case 'create':
          name = 'Create Ticket';
          break;
        case 'edit':
          name = 'Edit';
          break;
        default:
          // If it's a UUID/ID, show as "View Details"
          if (pathname.match(/^[0-9a-fA-F]{24}$/)) {
            name = 'Details';
          }
          break;
      }

      breadcrumbs.push({
        name,
        href: isLast ? undefined : currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.name} className="flex items-center">
            {index === 0 ? (
              <div className="flex items-center">
                <HomeIcon className="flex-shrink-0 h-4 w-4 text-gray-400" />
                {breadcrumb.href && !breadcrumb.current ? (
                  <Link
                    to={breadcrumb.href}
                    className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {breadcrumb.name}
                  </Link>
                ) : (
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {breadcrumb.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" />
                {breadcrumb.href && !breadcrumb.current ? (
                  <Link
                    to={breadcrumb.href}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    {breadcrumb.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {breadcrumb.name}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
