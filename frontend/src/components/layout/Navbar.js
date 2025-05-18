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

  const authLinks = (
    <ul className="flex items-center space-x-6">
      <li className="hidden md:block">
        <Link to="/dashboard" className="text-white hover:text-gray-300">
          Dashboard
        </Link>
      </li>
      <li className="hidden md:block">
        <Link to="/my-tickets" className="text-white hover:text-gray-300">
          Tiket Saya
        </Link>
      </li>
      <li className="hidden md:block">
        <Link to="/profile" className="text-white hover:text-gray-300 flex items-center">
          <span className="mr-2">
            {auth.user ? auth.user.username : 'Profil'}
          </span>
          <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            {auth.user && auth.user.username ? auth.user.username.charAt(0).toUpperCase() : 'U'}
          </div>
        </Link>
      </li>
      <li>
        <a
          onClick={logout}
          href="#!"
          className="text-white hover:text-gray-300 cursor-pointer flex items-center"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          <span className="hidden md:inline">Logout</span>
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="flex items-center space-x-6">
      <li className="hidden md:block">
        <Link to="/register" className="text-white hover:text-gray-300">
          Daftar
        </Link>
      </li>
      <li>
        <Link 
          to="/login" 
          className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
        >
          Login
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="bg-blue-600 shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to={auth.isAuthenticated ? "/dashboard" : "/"} 
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-white text-xl font-bold">TicketBus</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link 
                to={auth.isAuthenticated ? "/dashboard" : "/"} 
                className="text-white hover:text-gray-300 px-3 py-2"
              >
                Beranda
              </Link>
              <Link 
                to="/search-results" 
                className="text-white hover:text-gray-300 px-3 py-2"
              >
                Cari Tiket
              </Link>
              <Link 
                to="/about" 
                className="text-white hover:text-gray-300 px-3 py-2"
              >
                Tentang Kami
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:flex md:items-center">
              {!auth.loading && (
                <Fragment>{auth.isAuthenticated ? authLinks : guestLinks}</Fragment>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button 
                className="text-white focus:outline-none" 
                onClick={toggleMenu}
              >
                <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-700 rounded-b-lg">
              <Link 
                to={auth.isAuthenticated ? "/dashboard" : "/"} 
                className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link 
                to="/search-results" 
                className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Cari Tiket
              </Link>
              <Link 
                to="/about" 
                className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Tentang Kami
              </Link>
              
              {auth.isAuthenticated ? (
                <>
                  <div className="border-t border-blue-600 my-2"></div>
                  <Link 
                    to="/dashboard" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/my-tickets" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tiket Saya
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <a
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    href="#!"
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md cursor-pointer"
                  >
                    Logout
                  </a>
                </>
              ) : (
                <>
                  <div className="border-t border-blue-600 my-2"></div>
                  <Link 
                    to="/register" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Daftar
                  </Link>
                  <Link 
                    to="/login" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md"
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