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

  // Helper function to check if user is admin or super admin
  const isAdminRole = () => {
    return auth.user && ['admin', 'super_admin'].includes(auth.user.role);
  };

  // Helper function to get home path based on user role
  const getHomePath = () => {
    if (auth.isAuthenticated && auth.user) {
      if (auth.user.role === 'super_admin') {
        return '/admin/super-dashboard';
      } else if (auth.user.role === 'admin') {
        return '/admin/dashboard';
      } else {
        return '/dashboard';
      }
    }
    return '/';
  };

  // Helper function to get user display info based on role
  const getUserDisplayInfo = () => {
    if (!auth.user) return { bgColor: 'bg-white text-pink-600', icon: 'U' };
    
    switch (auth.user.role) {
      case 'super_admin':
        return {
          bgColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
          icon: <i className="fas fa-crown"></i>,
          title: 'Super Admin'
        };
      case 'admin':
        return {
          bgColor: 'bg-red-600 text-white',
          icon: <i className="fas fa-user-shield"></i>,
          title: 'Admin'
        };
      default:
        return {
          bgColor: 'bg-white text-pink-600',
          icon: auth.user.username ? auth.user.username.charAt(0).toUpperCase() : 'U',
          title: 'User'
        };
    }
  };

  const userInfo = getUserDisplayInfo();

  const authLinks = (
    <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-3">
      {/* Show different links based on user role */}
      {isAdminRole() ? (
        // Admin/Super Admin links - empty for desktop (handled by sidebar)
        <></>
      ) : (
        // Regular user links
        <div className="hidden md:block">
          <Link
            to="/my-tickets"
            className="text-white hover:text-gray-200 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-md hover:bg-pink-600 text-sm lg:text-base font-medium flex items-center"
          >
            Tiket Saya
          </Link>
        </div>
      )}

      {/* Profile Section */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Profile Link - Desktop */}
        <div className="hidden md:block">
          <Link
            to="/profile"
            className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-md hover:bg-pink-600"
          >
            <span className="text-sm lg:text-base font-medium">
              {auth.user ? auth.user.username : 'Profil'}
            </span>
            <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold transition-all duration-200 flex-shrink-0 shadow-md ${userInfo.bgColor}`}>
              {userInfo.icon}
            </div>
          </Link>
        </div>

        {/* Mobile Profile Avatar */}
        <div className="md:hidden">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${userInfo.bgColor}`}>
            {userInfo.icon}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center space-x-1 lg:space-x-2 text-white hover:text-gray-200 hover:bg-pink-600 px-2 lg:px-3 py-2 rounded-md transition-all duration-200"
          title="Logout"
        >
          <i className="fas fa-sign-out-alt text-sm lg:text-base"></i>
          <span className="hidden lg:inline text-sm lg:text-base font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  const guestLinks = (
    <div className="flex items-center space-x-2 lg:space-x-3">
      <div className="hidden md:block">
        <Link
          to="/register"
          className="text-white hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-pink-600 text-sm lg:text-base font-medium"
        >
          Registrasi
        </Link>
      </div>
      <Link
        to="/login"
        className="bg-white text-pink-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm lg:text-base"
      >
        Login
      </Link>
    </div>
  );

  return (
    <nav className="bg-pink-500 shadow-lg fixed w-full z-50 top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 lg:space-x-8">
            <Link
              to={getHomePath()}
              className="flex-shrink-0 group"
            >
              <span className="text-white text-xl lg:text-2xl font-bold group-hover:text-gray-200 transition-colors duration-200">
                Almira Travel
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
              <Link
                to={getHomePath()}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md hover:bg-pink-600 transition-all duration-200 text-sm lg:text-base font-medium flex items-center"
              >
                Beranda
              </Link>
              {/* Only show "Cari Tiket" for non-admin users */}
              {!isAdminRole() && (
                <Link
                  to="/search-results"
                  className="text-white hover:text-gray-200 px-3 py-2 rounded-md hover:bg-pink-600 transition-all duration-200 text-sm lg:text-base font-medium flex items-center"
                >
                  Cari Tiket
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Auth Links */}
          <div className="hidden md:flex items-center">
            {!auth.loading && (
              <Fragment>{auth.isAuthenticated ? authLinks : guestLinks}</Fragment>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {!auth.loading && auth.isAuthenticated && (
              <Fragment>{authLinks}</Fragment>
            )}
            <button
              className="text-white focus:outline-none p-2 rounded-md hover:bg-pink-600 transition-colors duration-200"
              onClick={toggleMenu}
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-pink-700 shadow-lg border-t border-pink-600">
            <div className="px-4 py-3 space-y-1">
              <Link
                to={getHomePath()}
                className="block text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>

              {/* Only show "Cari Tiket" for non-admin users */}
              {!isAdminRole() && (
                <Link
                  to="/search-results"
                  className="block text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cari Tiket
                </Link>
              )}

              {auth.isAuthenticated ? (
                <>
                  <div className="border-t border-pink-600 my-3"></div>

                  {/* Show different mobile menu items based on user role */}
                  {isAdminRole() ? (
                    // Admin/Super Admin mobile menu items
                    <>
                      {/* Dashboard link based on role */}
                      <Link
                        to={auth.user?.role === 'super_admin' ? '/admin/super-dashboard' : '/admin/dashboard'}
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className={`${auth.user?.role === 'super_admin' ? 'fas fa-crown' : 'fas fa-tachometer-alt'} mr-3 w-5 text-center`}></i>
                        <span>{auth.user?.role === 'super_admin' ? 'Super Admin Panel' : 'Admin Dashboard'}</span>
                      </Link>

                      {/* Super Admin gets both dashboards */}
                      {auth.user?.role === 'super_admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <i className="fas fa-tachometer-alt mr-3 w-5 text-center"></i>
                          <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <Link
                        to="/admin/users"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-users mr-3 w-5 text-center"></i>
                        Kelola User
                      </Link>
                      <Link
                        to="/admin/buses"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-bus mr-3 w-5 text-center"></i>
                        Kelola Bus
                      </Link>
                      <Link
                        to="/admin/routes"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-route mr-3 w-5 text-center"></i>
                        Kelola Rute
                      </Link>
                      <Link
                        to="/admin/tickets"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-ticket-alt mr-3 w-5 text-center"></i>
                        Kelola Tiket
                      </Link>
                    </>
                  ) : (
                    // Regular user mobile menu items
                    <>
                      <Link
                        to="/dashboard"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt mr-3 w-5 text-center"></i>
                        Dashboard
                      </Link>
                      <Link
                        to="/my-tickets"
                        className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-ticket-alt mr-3 w-5 text-center"></i>
                        Tiket Saya
                      </Link>
                    </>
                  )}

                  <Link
                    to="/profile"
                    className="flex items-center text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 ${userInfo.bgColor}`}>
                      {userInfo.icon}
                    </div>
                    <span>
                      Profil - {auth.user ? auth.user.username : 'User'}
                      {auth.user?.role === 'super_admin' && (
                        <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                          Super Admin
                        </span>
                      )}
                      {auth.user?.role === 'admin' && (
                        <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left text-white hover:bg-pink-600 px-3 py-3 rounded-md cursor-pointer transition-colors duration-200 text-base font-medium"
                  >
                    <i className="fas fa-sign-out-alt mr-3 w-5 text-center"></i>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-pink-600 my-3"></div>
                  <Link
                    to="/register"
                    className="block text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrasi
                  </Link>
                  <Link
                    to="/login"
                    className="block text-white hover:bg-pink-600 px-3 py-3 rounded-md transition-colors duration-200 text-base font-medium"
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