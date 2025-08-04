import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const AdminSidebar = ({ user }) => {
  const location = useLocation();
  
  // Base navigation items
  const baseNavItems = [
    {
      name: 'Dashboard',
      path: user?.role === 'super_admin' ? '/admin/super-dashboard' : '/admin/dashboard',
      icon: 'fas fa-tachometer-alt',
      roles: ['admin', 'super_admin']
    },
    {
      name: 'Kelola User',
      path: '/admin/users',
      icon: 'fas fa-users',
      roles: ['admin', 'super_admin'],
      superAdminFeature: true // Indicates this has super admin features
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
    },
  ];

  // Add Super Admin Panel untuk super_admin
  const navItems = user?.role === 'super_admin' 
    ? [
        {
          name: 'Super Admin Panel',
          path: '/admin/super-dashboard',
          icon: 'fas fa-crown',
          roles: ['super_admin'],
          isSpecial: true
        },
        ...baseNavItems.filter(item => item.name !== 'Dashboard')
      ]
    : baseNavItems;

  // Filter items berdasarkan role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  // Get user display info berdasarkan role
  const getUserInfo = () => {
    if (user?.role === 'super_admin') {
      return {
        bgColor: 'bg-purple-50',
        iconBg: 'bg-purple-600',
        badgeBg: 'bg-purple-100',
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
    <aside className="sidebar w-64 bg-white h-screen shadow-md fixed left-0 top-16 overflow-y-auto hidden md:block">
      {/* Admin info section */}
      <div className={`px-6 py-6 border-b border-gray-200 ${userInfo.bgColor}`}>
        <div className="flex items-center space-x-4">
          <div className={`${userInfo.iconBg} text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold`}>
            <i className={userInfo.icon}></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {user ? user.username : 'Admin'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user ? user.email : 'admin@example.com'}
            </p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userInfo.badgeBg} ${userInfo.badgeText} mt-1`}>
              <span className={`w-2 h-2 ${userInfo.iconBg} rounded-full mr-1`}></span>
              {userInfo.title}
            </span>
          </div>
        </div>
      </div>

      {/* Super Admin Quick Actions - Hanya untuk super_admin */}
      {user?.role === 'super_admin' && (
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <i className="fas fa-crown mr-2"></i>
            Quick Actions
          </h4>
          <button 
            onClick={() => {
              // Trigger modal untuk create user - implementasi bisa via Redux action atau prop
              const event = new CustomEvent('openQuickCreateUser');
              window.dispatchEvent(event);
            }}
            className="w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition-all"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Buat User Bypass OTP
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="mt-6">
        <ul className="px-4 space-y-1">
          {filteredNavItems.map((item, index) => {
            // Determine active color berdasarkan user role dan item
            const getActiveColor = () => {
              if (item.isSpecial) {
                return 'bg-purple-50 text-purple-700 font-medium border-r-2 border-purple-600';
              }
              return userInfo.activeColor === 'purple' 
                ? 'bg-purple-50 text-purple-700 font-medium border-r-2 border-purple-600'
                : 'bg-red-50 text-red-700 font-medium border-r-2 border-red-600';
            };

            const getIconColor = () => {
              if (item.isSpecial) {
                return location.pathname === item.path ? 'text-purple-600' : 'text-gray-400';
              }
              return location.pathname === item.path 
                ? (userInfo.activeColor === 'purple' ? 'text-purple-600' : 'text-red-600')
                : 'text-gray-400';
            };

            return (
              <li key={item.name}>
                {/* Separator sebelum Super Admin Panel */}
                {item.isSpecial && (
                  <div className="pb-2 mb-2">
                    <div className="border-t border-gray-200"></div>
                    <p className="text-xs text-purple-500 uppercase tracking-wide font-medium mt-2 px-4">
                      Super Admin
                    </p>
                  </div>
                )}

                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? getActiveColor()
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <i className={`${item.icon} w-5 text-center mr-3 ${getIconColor()}`}></i>
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Super Admin feature indicator */}
                  {item.superAdminFeature && user?.role === 'super_admin' && (
                    <i className="fas fa-crown text-xs text-purple-400 ml-2"></i>
                  )}
                </Link>

                {/* Separator setelah Super Admin Panel */}
                {item.isSpecial && (
                  <div className="pt-2 mt-2">
                    <div className="border-t border-gray-200"></div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mt-2 px-4">
                      System Management
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Super Admin Privileges Info - Hanya untuk super_admin */}
      {user?.role === 'super_admin' && (
        <div className="mx-4 mt-6 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="text-xs font-medium text-purple-800 mb-2 flex items-center">
            <i className="fas fa-crown mr-2"></i>
            Super Admin Privileges
          </h4>
          <ul className="text-xs text-purple-700 space-y-1">
            <li className="flex items-center">
              <i className="fas fa-check text-purple-500 mr-2 w-3"></i>
              Buat user bypass OTP
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-purple-500 mr-2 w-3"></i>
              Kelola semua administrator
            </li>
            <li className="flex items-center">
              <i className="fas fa-check text-purple-500 mr-2 w-3"></i>
              Akses penuh sistem
            </li>
          </ul>
        </div>
      )}
      
      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">
            Admin Panel v1.0.0
            {user?.role === 'super_admin' && (
              <span className="ml-1 text-purple-500">
                <i className="fas fa-crown"></i>
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">© 2025 Almira Travel</p>
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