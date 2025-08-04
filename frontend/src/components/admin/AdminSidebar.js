import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const AdminSidebar = ({ user }) => {
  const location = useLocation();
  
  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Kelola User',
        path: '/admin/users',
        icon: 'fas fa-users',
        roles: ['admin', 'super_admin'],
        superAdminFeature: true
      },
      {
        name: 'Kelola Bus',
        path: '/admin/buses',
        icon: 'fas fa-bus',
        roles: ['admin', 'super_admin']
      },
      {
        name: 'Kelola Rute',
        path: '/admin/routes',
        icon: 'fas fa-route',
        roles: ['admin', 'super_admin']
      },
      {
        name: 'Kelola Tiket',
        path: '/admin/tickets',
        icon: 'fas fa-ticket-alt',
        roles: ['admin', 'super_admin']
      }
    ];

    if (user?.role === 'super_admin') {
      return [
        {
          name: 'Super Admin Panel',
          path: '/admin/super-dashboard',
          icon: 'fas fa-crown',
          roles: ['super_admin'],
          isSpecial: true,
          description: 'Dashboard khusus Super Admin'
        },
        {
          name: 'Admin Dashboard',
          path: '/admin/dashboard',
          icon: 'fas fa-tachometer-alt',
          roles: ['super_admin'],
          description: 'Dashboard administrator biasa'
        },
        ...baseItems
      ];
    } else {
      return [
        {
          name: 'Dashboard',
          path: '/admin/dashboard',
          icon: 'fas fa-tachometer-alt',
          roles: ['admin']
        },
        ...baseItems
      ];
    }
  };

  const navItems = getNavigationItems();

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  // Get user display info based on role
  const getUserInfo = () => {
    if (user?.role === 'super_admin') {
      return {
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
        iconBg: 'bg-gradient-to-r from-purple-600 to-pink-600',
        badgeBg: 'bg-gradient-to-r from-purple-100 to-pink-100',
        badgeText: 'text-purple-800',
        icon: 'fas fa-crown',
        title: 'Super Administrator',
        activeColor: 'purple'
      };
    } else {
      return {
        bgColor: 'bg-red-50',
        iconBg: 'bg-red-600', 
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-800',
        icon: 'fas fa-user-shield',
        title: 'Administrator',
        activeColor: 'red'
      };
    }
  };

  const userInfo = getUserInfo();
  
  return (
    <aside className="sidebar w-64 bg-white h-screen shadow-lg fixed left-0 top-16 overflow-y-auto hidden md:block border-r border-gray-200">
      {/* Enhanced Admin info section */}
      <div className={`px-6 py-6 border-b border-gray-200 ${userInfo.bgColor}`}>
        <div className="flex items-center space-x-4">
          <div className={`${userInfo.iconBg} text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg`}>
            <i className={userInfo.icon}></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-lg">
              {user ? user.username : 'Admin'}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {user ? user.email : 'admin@example.com'}
            </p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${userInfo.badgeBg} ${userInfo.badgeText} mt-2 shadow-sm`}>
              <span className={`w-2 h-2 ${userInfo.iconBg} rounded-full mr-2 animate-pulse`}></span>
              {userInfo.title}
            </span>
          </div>
        </div>
      </div>

      {/* Super Admin Quick Actions - Enhanced */}
      {user?.role === 'super_admin' && (
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
          <h4 className="text-sm font-bold mb-3 flex items-center">
            <i className="fas fa-bolt mr-2 animate-pulse"></i>
            Super Admin Powers
          </h4>
          <div className="space-y-2">
            <button 
              onClick={() => {
                const event = new CustomEvent('openQuickCreateUser');
                window.dispatchEvent(event);
              }}
              className="w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Quick Create User
            </button>
            
            <div className="text-xs bg-white bg-opacity-10 rounded-lg px-3 py-2">
              <i className="fas fa-shield-alt mr-2"></i>
              Full System Access
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="mt-2">
        <ul className="px-4 space-y-1">
          {filteredNavItems.map((item, index) => {
            // Determine active styling based on user role and item
            const getActiveColor = () => {
              if (item.isSpecial) {
                return 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-bold border-r-4 border-purple-600 shadow-md';
              }
              return userInfo.activeColor === 'purple' 
                ? 'bg-purple-50 text-purple-700 font-semibold border-r-3 border-purple-600'
                : 'bg-red-50 text-red-700 font-semibold border-r-3 border-red-600';
            };

            const getIconColor = () => {
              if (item.isSpecial) {
                return location.pathname === item.path ? 'text-purple-600' : 'text-gray-400';
              }
              return location.pathname === item.path 
                ? (userInfo.activeColor === 'purple' ? 'text-purple-600' : 'text-red-600')
                : 'text-gray-400';
            };

            const isActive = location.pathname === item.path;

            return (
              <li key={item.name}>
                {/* Special separator for Super Admin Panel */}
                {item.isSpecial && (
                  <div className="pb-3 mb-3">
                    <div className="border-t border-purple-200"></div>
                    <p className="text-xs text-purple-600 uppercase tracking-wide font-bold mt-3 px-4 flex items-center">
                      <i className="fas fa-crown mr-2"></i>
                      Super Admin
                    </p>
                  </div>
                )}

                <Link
                  to={item.path}
                  className={`group flex items-center px-4 py-3 rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? getActiveColor()
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-pink-600 rounded-r-full"></div>
                  )}
                  
                  <i className={`${item.icon} w-5 text-center mr-3 transition-colors duration-200 ${getIconColor()}`}></i>
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  
                  {/* Super Admin feature indicator */}
                  {item.superAdminFeature && user?.role === 'super_admin' && (
                    <i className="fas fa-crown text-xs text-purple-400 ml-2 opacity-70"></i>
                  )}
                  
                  {/* Hover arrow */}
                  <i className="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-50 transition-opacity duration-200 ml-2"></i>
                </Link>

                {/* Separator after Super Admin Panel */}
                {item.isSpecial && (
                  <div className="pt-3 mt-3">
                    <div className="border-t border-gray-200"></div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mt-3 px-4">
                      System Management
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Enhanced Privileges Info for Super Admin */}
      {user?.role === 'super_admin' && (
        <div className="mx-4 mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-sm">
          <h4 className="text-xs font-bold text-purple-800 mb-3 flex items-center">
            <i className="fas fa-crown mr-2"></i>
            Super Admin Privileges
          </h4>
          <ul className="text-xs text-purple-700 space-y-2">
            <li className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2 w-3"></i>
              <span>Create verified users</span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2 w-3"></i>
              <span>Manage all administrators</span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2 w-3"></i>
              <span>Full system oversight</span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-2 w-3"></i>
              <span>Bypass OTP system</span>
            </li>
          </ul>
        </div>
      )}
      
      {/* Enhanced Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-600 font-semibold flex items-center justify-center">
            <i className="fas fa-shield-alt mr-2 text-blue-500"></i>
            Admin Panel v2.0.0
            {user?.role === 'super_admin' && (
              <span className="ml-2 text-purple-600">
                <i className="fas fa-crown"></i>
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">© 2025 Almira Travel</p>
          {user?.role === 'super_admin' && (
            <p className="text-xs text-purple-600 mt-1 font-medium">
              Super Admin Mode Active
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

AdminSidebar.propTypes = {
  user: PropTypes.object
};

const mapStateToProps = (state) => ({
  user: state.auth.user
});

export default connect(mapStateToProps)(AdminSidebar);