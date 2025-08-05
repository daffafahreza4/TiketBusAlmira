import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const AdminSidebar = ({ user, isOpen = false, onClose }) => {
  const location = useLocation();
  
  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        path: user?.role === 'super_admin' ? '/admin/super-dashboard' : '/admin/dashboard',
        icon: 'fas fa-tachometer-alt',
        roles: ['admin', 'super_admin']
      },
      // Quick Create User hanya untuk Super Admin
      ...(user?.role === 'super_admin' ? [{
        name: 'Quick Create User',
        path: '#',
        icon: 'fas fa-user-plus',
        roles: ['super_admin'],
        isQuickAction: true
      }] : []),
      {
        name: 'Kelola User',
        path: '/admin/users',
        icon: 'fas fa-users',
        roles: ['admin', 'super_admin']
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

    // Filter items based on user role
    return baseItems.filter(item => 
      item.roles.includes(user?.role)
    );
  };

  const navItems = getNavigationItems();

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
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar w-64 bg-white h-screen shadow-lg fixed left-0 top-16 overflow-y-auto border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:block`}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      {/* Admin info section */}
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


      
      {/* Navigation */}
      <nav className="mt-2">
        <ul className="px-4 space-y-1">
          {navItems.map((item, index) => {
            const getActiveColor = () => {
              return userInfo.activeColor === 'purple' 
                ? 'bg-purple-50 text-purple-700 font-semibold border-r-3 border-purple-600'
                : 'bg-red-50 text-red-700 font-semibold border-r-3 border-red-600';
            };

            const getIconColor = () => {
              return location.pathname === item.path 
                ? (userInfo.activeColor === 'purple' ? 'text-purple-600' : 'text-red-600')
                : 'text-gray-400';
            };

            const isActive = location.pathname === item.path;

            return (
              <li key={item.name}>
                {item.isQuickAction ? (
                  // Quick Create User sebagai button
                  <button
                    onClick={() => {
                      const event = new CustomEvent('openQuickCreateUser');
                      window.dispatchEvent(event);
                    }}
                    className={`group flex items-center px-4 py-3 rounded-lg transition-all duration-200 relative w-full text-left ${
                      'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                    }`}
                  >
                    <i className={`${item.icon} w-5 text-center mr-3 transition-colors duration-200 text-gray-400`}></i>
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                    </div>
                    
                    {/* Crown indicator untuk Quick Create User */}
                    <i className="fas fa-crown text-xs text-purple-400 ml-2 opacity-70"></i>
                    
                    {/* Hover arrow */}
                    <i className="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-50 transition-opacity duration-200 ml-2"></i>
                  </button>
                ) : (
                  // Menu item biasa
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
                    </div>
                    
                    {/* Super Admin indicator for Dashboard */}
                    {user?.role === 'super_admin' && item.name === 'Dashboard' && (
                      <i className="fas fa-crown text-xs text-purple-400 ml-2 opacity-70"></i>
                    )}
                    
                    {/* Hover arrow */}
                    <i className="fas fa-chevron-right text-xs opacity-0 group-hover:opacity-50 transition-opacity duration-200 ml-2"></i>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
          </aside>
    </>
  );
};

AdminSidebar.propTypes = {
  user: PropTypes.object,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

const mapStateToProps = (state) => ({
  user: state.auth.user
});

export default connect(mapStateToProps)(AdminSidebar);