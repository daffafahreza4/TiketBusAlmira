import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../redux/actions/authActions';

const Navbar = ({ auth = { isAuthenticated: false, loading: true, user: null }, logout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper function to get home path based on user role
  const getHomePath = () => {
    if (auth.isAuthenticated && auth.user) {
      return auth.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    }
    return '/';
  };

  const authLinks = (
    <ul className="flex items-center space-x-4 lg:space-x-6">
      {/* Show different links based on user role */}
      {auth.user?.role === 'admin' ? (
        // Admin links
        <></>
      ) : (
        // Regular user links
        <>
          <li className="hidden md:block">
            <Link to="/my-tickets" className="text-white hover:text-gray-200 transition-colors duration-200">
              Tiket Saya
            </Link>
          </li>
        </>
      )}
      
      <li className="hidden md:block">
        <Link to="/profile" className="text-white hover:text-gray-200 flex items-center space-x-2 transition-colors duration-200">
          <span>{auth.user ? auth.user.username : 'Profil'}</span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            auth.user?.role === 'admin' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-blue-600'
          }`}>
            {auth.user?.role === 'admin' ? (
              <i className="fas fa-user-shield"></i>
            ) : (
              auth.user && auth.user.username ? auth.user.username.charAt(0).toUpperCase() : 'U'
            )}
          </div>
        </Link>
      </li>
      <li>
        <button
          onClick={logout}
          className="text-white hover:text-gray-200 flex items-center space-x-1 cursor-pointer transition-colors duration-200"
        >
          <i className="fas fa-sign-out-alt"></i>
          <span className="hidden md:inline">Logout</span>
        </button>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="flex items-center space-x-4">
      <li className="hidden md:block">
        <Link to="/register" className="text-white hover:text-gray-200 transition-colors duration-200">
          Daftar
        </Link>
      </li>
      <li>
        <Link 
          to="/login" 
          className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
        >
          Login
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="bg-blue-600 shadow-lg fixed w-full z-50 top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link 
              to={getHomePath()} 
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-white text-xl font-bold">Almira Travel</span>
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:space-x-6 md:ml-8">
              <Link 
                to={getHomePath()} 
                className="text-white hover:text-gray-200 px-3 py-2 transition-colors duration-200"
              >
                Beranda
              </Link>
              {/* Only show "Cari Tiket" for non-admin users */}
              {auth.user?.role !== 'admin' && (
                <Link 
                  to="/search-results" 
                  className="text-white hover:text-gray-200 py-2 transition-colors duration-200"
                >
                  Cari Tiket
                </Link>
              )}
            </div>
          </div>
          
          {/* Desktop Auth Links */}
          <div className="hidden md:flex md:items-center">
            {!auth.loading && (
              <Fragment>{auth.isAuthenticated ? authLinks : guestLinks}</Fragment>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              className="text-white focus:outline-none p-2" 
              onClick={toggleMenu}
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-blue-700 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <Link 
                to={getHomePath()} 
                className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>
              
              {/* Only show "Cari Tiket" for non-admin users */}
              {auth.user?.role !== 'admin' && (
                <Link 
                  to="/search-results" 
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cari Tiket
                </Link>
              )}
              
              <Link 
                to="/about" 
                className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Tentang Kami
              </Link>
              
              {auth.isAuthenticated ? (
                <>
                  <div className="border-t border-blue-600 my-2"></div>

                  {/* Show different mobile menu items based on user role */}
                  {auth.user?.role === 'admin' ? (
                    // Admin mobile menu items
                    <>
                      <Link 
                        to="/admin/users" 
                        className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Kelola User
                      </Link>
                      <Link 
                        to="/admin/buses" 
                        className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Kelola Bus
                      </Link>
                      <Link 
                        to="/admin/routes" 
                        className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Kelola Rute
                      </Link>
                      <Link 
                        to="/admin/tickets" 
                        className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Kelola Tiket
                      </Link>
                    </>
                  ) : (
                    // Regular user mobile menu items
                    <Link 
                      to="/my-tickets" 
                      className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Tiket Saya
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-white hover:bg-blue-600 px-3 py-2 rounded-md cursor-pointer transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-blue-600 my-2"></div>
                  <Link 
                    to="/register" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Daftar
                  </Link>
                  <Link 
                    to="/login" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps, { logout })(Navbar);