import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { register } from '../../redux/actions/authActions';
import { setAlert } from '../../redux/actions/alertActions';
import Spinner from '../layout/Spinner';

const Register = ({ register, isAuthenticated, loading, setAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    phone: ''
  });

  const { name, email, password, password2, phone } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== password2) {
      setAlert('Password tidak cocok', 'danger');
    } else {
      register(formData);
    }
  };

  // Redirect jika sudah login
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-gray-800">Daftar Akun</h3>
        {loading ? (
          <Spinner />
        ) : (
          <form className="mt-4" onSubmit={onSubmit}>
            <div className="mt-4">
              <label className="block text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Nama Lengkap"
                name="name"
                value={name}
                onChange={onChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              />
            </div>
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
              <label className="block text-gray-700">Nomor Telepon</label>
              <input
                type="text"
                placeholder="Nomor Telepon"
                name="phone"
                value={phone}
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
                minLength="6"
                required
              />
            </div>
            <div className="mt-4">
              <label className="block text-gray-700">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Konfirmasi Password"
                name="password2"
                value={password2}
                onChange={onChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                minLength="6"
                required
              />
            </div>
            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full"
              >
                Daftar
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

Register.propTypes = {
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading
});

export default connect(mapStateToProps, { register, setAlert })(Register);