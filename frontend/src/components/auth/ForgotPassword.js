import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setAlert } from '../../redux/actions/alertActions';
import axios from 'axios';
import Spinner from '../layout/Spinner';

const ForgotPassword = ({ setAlert }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const onChange = e => setEmail(e.target.value);

  const onSubmit = async e => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({ email });
      
      await axios.post('/api/auth/forgot-password', body, config);
      
      setEmailSent(true);
      setAlert('Link reset password telah dikirim ke email Anda', 'success');
    } catch (err) {
      const errorMsg = err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengirim email reset password';
        
      setAlert(errorMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <h3 className="text-2xl font-bold text-center text-gray-800">Email Terkirim</h3>
          <div className="mt-4 text-center">
            <p className="mb-4">
              Link reset password telah dikirim ke email Anda. 
              Silakan cek kotak masuk atau folder spam Anda.
            </p>
            <p className="mt-6">
              <Link to="/login" className="text-blue-600 hover:underline">
                Kembali ke halaman login
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
        <h3 className="text-2xl font-bold text-center text-gray-800">Lupa Password</h3>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <p className="text-center mt-4 text-gray-600">
              Masukkan email Anda untuk menerima link reset password
            </p>
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
              <div className="flex items-center justify-between mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full"
                >
                  Kirim Link Reset
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
          </>
        )}
      </div>
    </div>
  );
};

ForgotPassword.propTypes = {
  setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(ForgotPassword);