import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const Sidebar = ({ user }) => {
  const location = useLocation();
  
  // Navigation items
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      name: 'Tiket Saya',
      path: '/my-tickets',
      icon: 'fas fa-ticket-alt'
    },
    {
      name: 'Pesan Tiket',
      path: '/search-results',
      icon: 'fas fa-search'
    },
    {
      name: 'Profil',
      path: '/profile',
      icon: 'fas fa-user'
    },
    {
      name: 'Bantuan',
      path: '/help',
      icon: 'fas fa-question-circle'
    }
  ];
  
  return (
    <aside className="sidebar w-64 bg-white h-screen shadow-md fixed left-0 top-16 overflow-y-auto hidden md:block">
      {/* User info section */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
            {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {user ? user.username : 'User'}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {user ? user.email : 'user@example.com'}
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              Terverifikasi
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
                    ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`${item.icon} w-5 text-center mr-3 ${
                  location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'
                }`}></i>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom section with app version */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium">Almira Travel v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2025 Almira Travel</p>
        </div>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  user: PropTypes.object
};

const mapStateToProps = (state) => ({
  user: state.auth.user
});

export default connect(mapStateToProps)(Sidebar);