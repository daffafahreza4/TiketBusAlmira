import React, { useState, useEffect } from 'react';
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
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  const { password, password2 } = formData;

  // Verifikasi token ketika komponen dimuat
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // FIXED: Changed endpoint to match backend route
        await axios.get(`/api/auth/reset-password/${token}`);
        setTokenValid(true);
      } catch (err) {
        setAlert('Token reset password tidak valid atau sudah kadaluarsa', 'danger');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, setAlert]);

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    
    if (password !== password2) {
      setAlert('Password tidak cocok', 'danger');
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
      
      // FIXED: Changed endpoint to match backend route with kebab-case
      await axios.post(`/api/auth/reset-password/${token}`, body, config);
      
      setAlert('Password berhasil direset', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mereset password';
        
      setAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <h3 className="text-2xl font-bold text-center text-gray-800">Reset Password</h3>
          <div className="mt-4 text-center">
            <Spinner />
            <p className="mt-4">Memverifikasi token reset password...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <h3 className="text-2xl font-bold text-center text-gray-800">Token Tidak Valid</h3>
          <div className="mt-4 text-center">
            <p className="mb-4">
              Token reset password tidak valid atau sudah kadaluarsa.
            </p>
            <p className="mt-6">
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Kirim ulang link reset password
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full"
              >
                Reset Password
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm">
                <Link to="/login" className="text-blue-600 hover:underline">
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