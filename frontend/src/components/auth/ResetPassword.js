import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setAlert } from '../../redux/actions/alertActions';
import axios from 'axios';
import Spinner from '../layout/Spinner';

const ResetPassword = ({ setAlert }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    password2: ''
  });
  const [loading, setLoading] = useState(false);

  const { password, password2 } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    
    if (password !== password2) {
      setAlert('Password tidak cocok', 'danger');
      return;
    }

    if (password.length < 6) {
      setAlert('Password minimal 6 karakter', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({ password });
      
      // FIXED: Use the correct backend endpoint (resetpassword, not reset-password)
      await axios.put(`/api/auth/resetpassword/${token}`, body, config);
      
      setAlert('Password berhasil direset', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Token tidak valid atau sudah kadaluarsa';
        
      setAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-gray-800">Reset Password</h3>
        {loading ? (
          <Spinner />
        ) : (
          <form className="mt-4" onSubmit={onSubmit}>
            <div className="mt-4">
              <label className="block text-gray-700">Password Baru</label>
              <input
                type="password"
                placeholder="Password Baru"
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
                className="px-6 py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-900 w-full"
              >
                Reset Password
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm">
                <Link to="/login" className="text-pink-600 hover:underline">
                  Kembali ke halaman login
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

ResetPassword.propTypes = {
  setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(ResetPassword);