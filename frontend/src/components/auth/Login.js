import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../redux/actions/authActions';
import Spinner from '../layout/Spinner';

const Login = ({ login, isAuthenticated, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    login(email, password);
  };

  // Redirect jika sudah login
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-gray-800">Login</h3>
        {loading ? (
          <Spinner />
        ) : (
          <form className="mt-4" onSubmit={onSubmit}>
            <div className="mt-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={email}
                onChange={onChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full"
              >
                Login
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm">
                Belum punya akun?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Daftar
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading
});

export default connect(mapStateToProps, { login })(Login);