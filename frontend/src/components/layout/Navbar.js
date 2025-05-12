import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../redux/actions/authActions';

const Navbar = ({ auth = { isAuthenticated: false, loading: true, user: null }, logout }) => {
  const authLinks = (
    <ul className="flex items-center space-x-6">
      <li>
        <Link to="/dashboard" className="text-white hover:text-gray-300">
          Dashboard
        </Link>
      </li>
      <li>
        <Link to="/my-tickets" className="text-white hover:text-gray-300">
          Tiket Saya
        </Link>
      </li>
      <li>
        <Link to="/profile" className="text-white hover:text-gray-300">
          {auth.user ? auth.user.username : 'Profil'}
        </Link>
      </li>
      <li>
        <a
          onClick={logout}
          href="#!"
          className="text-white hover:text-gray-300 cursor-pointer"
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </a>
      </li>
    </ul>
  );

  const guestLinks = (
    <ul className="flex items-center space-x-6">
      <li>
        <Link to="/register" className="text-white hover:text-gray-300">
          Daftar
        </Link>
      </li>
      <li>
        <Link to="/login" className="text-white hover:text-gray-300">
          Login
        </Link>
      </li>
    </ul>
  );

  return (
    <nav className="bg-blue-600 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">TicketBus</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link to="/" className="text-white hover:text-gray-300 px-3 py-2">
                Beranda
              </Link>
              <Link to="/rute" className="text-white hover:text-gray-300 px-3 py-2">
                Rute
              </Link>
              <Link to="/about" className="text-white hover:text-gray-300 px-3 py-2">
                Tentang Kami
              </Link>
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center">
            {!auth.loading && (
              <Fragment>{auth.isAuthenticated ? authLinks : guestLinks}</Fragment>
            )}
          </div>
        </div>
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