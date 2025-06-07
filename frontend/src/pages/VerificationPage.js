import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { verifyOTP, resendOTP } from '../redux/actions/authActions';
import { setAlert } from '../redux/actions/alertActions';
import Spinner from '../components/layout/Spinner';

const VerificationPage = ({ 
  verifyOTP, 
  resendOTP, 
  isAuthenticated, 
  loading, 
  user, 
  setAlert 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or URL params
  const [email] = useState(
    location.state?.email || 
    new URLSearchParams(location.search).get('email') || 
    ''
  );
  
  const [formData, setFormData] = useState({
    otp: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { otp } = formData;

  // Redirect to register if no email provided - HARUS SEBELUM CONDITIONAL RETURN
  useEffect(() => {
    if (!email) {
      setAlert('Email tidak ditemukan. Silakan daftar ulang.', 'danger');
      navigate('/register');
    }
  }, [email, navigate, setAlert]);

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setAlert('Masukkan kode OTP 6 digit', 'danger');
      return;
    }

    setSubmitting(true);
    
    try {
      await verifyOTP({ email, otp });
      setAlert('Verifikasi berhasil! Selamat datang di Almira Travel', 'success');
    } catch (error) {
      // Error handling sudah dilakukan di action
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setSubmitting(true);
    
    try {
      await resendOTP({ email });
      setAlert('Kode OTP baru telah dikirim', 'success');
      
      // Start cooldown
      setResendCooldown(60);
      const countdown = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      // Error handling sudah dilakukan di action
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-envelope text-blue-600 text-2xl"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Verifikasi Email</h3>
          <p className="text-gray-600 text-sm mt-2">
            Masukkan kode OTP yang telah dikirim ke
          </p>
          <p className="text-blue-600 font-semibold text-sm break-all">
            {email}
          </p>
        </div>
        
        {submitting ? (
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-gray-600">Memverifikasi...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-center mb-4 font-medium">
                Kode Verifikasi OTP
              </label>
              <input
                type="text"
                placeholder="000000"
                name="otp"
                value={otp}
                onChange={onChange}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                disabled={submitting}
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Masukkan 6 digit kode yang dikirim ke email Anda
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? 'Memverifikasi...' : 'Verifikasi Akun'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Tidak menerima kode?
          </p>
          <button
            type="button"
            onClick={onResendOtp}
            className={`text-blue-600 hover:text-blue-800 font-medium transition-colors ${
              resendCooldown > 0 || submitting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:underline'
            }`}
            disabled={resendCooldown > 0 || submitting}
          >
            {resendCooldown > 0 
              ? `Kirim ulang dalam ${resendCooldown} detik` 
              : 'Kirim ulang kode OTP'
            }
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Salah email?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Daftar ulang
            </Link>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

VerificationPage.propTypes = {
  verifyOTP: PropTypes.func.isRequired,
  resendOTP: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
  user: PropTypes.object,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading,
  user: state.auth.user
});

export default connect(mapStateToProps, { verifyOTP, resendOTP, setAlert })(VerificationPage);