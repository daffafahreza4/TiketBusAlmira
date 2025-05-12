import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setAlert } from '../../redux/actions/alertActions';
import axios from 'axios';
import Spinner from '../layout/Spinner';

const VerifyAccount = ({ setAlert }) => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyAccount = async () => {
      try {
        await axios.get(`/api/auth/verify/${token}`);
        setVerified(true);
        setAlert('Akun berhasil diverifikasi', 'success');
      } catch (err) {
        const errorMsg = err.response && err.response.data.message 
          ? err.response.data.message 
          : 'Token verifikasi tidak valid atau sudah kadaluarsa';
          
        setAlert(errorMsg, 'danger');
        setVerified(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAccount();
  }, [token, setAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <h3 className="text-2xl font-bold text-center text-gray-800">Verifikasi Akun</h3>
          <div className="mt-4 text-center">
            <Spinner />
            <p className="mt-4">Memverifikasi akun Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-gray-800">
          {verified ? 'Verifikasi Berhasil' : 'Verifikasi Gagal'}
        </h3>
        <div className="mt-4 text-center">
          {verified ? (
            <div>
              <p className="mb-4">
                Akun Anda telah berhasil diverifikasi. Sekarang Anda dapat login dan menggunakan semua fitur aplikasi.
              </p>
              <Link
                to="/login"
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900 inline-block"
              >
                Login Sekarang
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Token verifikasi tidak valid atau sudah kadaluarsa. Silakan hubungi administrator 
                atau minta link verifikasi baru.
              </p>
              <Link
                to="/login"
                className="text-blue-600 hover:underline"
              >
                Kembali ke halaman login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

VerifyAccount.propTypes = {
  setAlert: PropTypes.func.isRequired
};

export default connect(null, { setAlert })(VerifyAccount);