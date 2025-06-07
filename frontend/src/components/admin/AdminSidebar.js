import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const AdminSidebar = ({ user }) => {
  const location = useLocation();
  
  // Navigation items for admin
  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      name: 'Kelola User',
      path: '/admin/users',
      icon: 'fas fa-users'
    },
    {
      name: 'Kelola Bus',
      path: '/admin/buses',
      icon: 'fas fa-bus'
    },
    {
      name: 'Kelola Rute',
      path: '/admin/routes',
      icon: 'fas fa-route'
    },
    {
      name: 'Kelola Tiket',
      path: '/admin/tickets',
      icon: 'fas fa-ticket-alt'
    },
  ];
  
  return (
    <aside className="sidebar w-64 bg-white h-screen shadow-md fixed left-0 top-16 overflow-y-auto hidden md:block">
      {/* Admin info section */}
      <div className="px-6 py-6 border-b border-gray-200 bg-red-50">
        <div className="flex items-center space-x-4">
          <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {user ? user.username : 'Admin'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user ? user.email : 'admin@example.com'}
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
              Administrator
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6">
        <ul className="px-4 space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-red-50 text-red-700 font-medium border-r-2 border-red-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`${item.icon} w-5 text-center mr-3 ${
                  location.pathname === item.path ? 'text-red-600' : 'text-gray-400'
                }`}></i>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Admin Panel v1.0.0</p>
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