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
    <aside className="w-64 bg-white h-screen shadow-md pt-8 fixed left-0 top-0 overflow-y-auto hidden md:block">
      {/* User info section */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold">
            {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="truncate">
            <h3 className="font-semibold truncate">{user ? user.username : 'User'}</h3>
            <p className="text-xs text-gray-500 truncate">{user ? user.email : 'user@example.com'}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6">
        <ul className="px-4">
          {navItems.map((item) => (
            <li key={item.name} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`${item.icon} w-5 text-center`}></i>
                <span className="ml-3">{item.name}</span>
                
                {/* Active indicator */}
                {location.pathname === item.path && (
                  <span className="ml-auto w-1.5 h-8 rounded-full bg-blue-600"></span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Bottom section with app version */}
      <div className="absolute bottom-0 w-full px-6 py-4 text-xs text-gray-500 border-t">
        <p>TicketBus v1.0.0</p>
        <p className="mt-1">© 2025 TicketBus</p>
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