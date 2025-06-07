import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login, verifyOTP, resendOTP } from '../../redux/actions/authActions';
import { setAlert } from '../../redux/actions/alertActions';
import Spinner from '../layout/Spinner';

const Login = ({ login, verifyOTP, resendOTP, isAuthenticated, loading, user, setAlert }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('login'); // 'login' | 'verify'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { email, password } = formData;
  const { otp } = otpData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onOtpChange = e =>
    setOtpData({ ...otpData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const result = await login(email, password);
      
      // If login requires verification, show OTP form
      if (result && result.requiresVerification) {
        setOtpData({ ...otpData, email: result.email });
        setCurrentStep('verify');
        setAlert('Akun belum diverifikasi. Silakan masukkan kode OTP.', 'warning');
      }
    } catch (error) {
      // Check if error indicates need for verification
      if (error && error.requiresVerification) {
        setOtpData({ ...otpData, email: error.email });
        setCurrentStep('verify');
        setAlert('Akun belum diverifikasi. Silakan masukkan kode OTP.', 'warning');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle OTP verification
  const onVerifyOtp = async e => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setAlert('Masukkan kode OTP 6 digit', 'danger');
      return;
    }

    setSubmitting(true);
    
    try {
      await verifyOTP({ email: otpData.email, otp });
      setAlert('Verifikasi berhasil! Selamat datang di Almira Travel', 'success');
    } catch (error) {
      // Error handling sudah dilakukan di action
    } finally {
      setSubmitting(false);
    }
  };

  // Handle resend OTP
  const onResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setSubmitting(true);
    
    try {
      await resendOTP({ email: otpData.email });
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

  // Effect untuk handle redirect setelah user loaded
  useEffect(() => {
    if (isAuthenticated && !loading && user) {
      const targetPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, loading, user, navigate]);

  // Early return untuk redirect langsung jika sudah authenticated
  if (isAuthenticated && user && !loading) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Show loading saat authenticating atau submitting
  if (loading && currentStep === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
          <h3 className="text-2xl font-bold text-center text-gray-800">Login</h3>
          <div className="text-center mt-8">
            <Spinner />
            <p className="mt-4 text-gray-600">Memuat data pengguna...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        {currentStep === 'login' ? (
          <>
            <h3 className="text-2xl font-bold text-center text-gray-800">Login</h3>
            <p className="text-center text-gray-600 text-sm mt-2">
              Masuk ke akun Almira Travel Anda
            </p>
            
            {submitting ? (
              <div className="text-center mt-8">
                <Spinner />
                <p className="mt-4 text-gray-600">Memproses login...</p>
              </div>
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Memproses...' : 'Login'}
                  </button>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm">
                    Belum punya akun?{' '}
                    <Link to="/register" className="text-blue-600 hover:underline">
                      Daftar
                    </Link>
                  </p>
                  <p className="text-sm">
                    <Link to="/" className="text-blue-600 hover:underline">
                      Kembali
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-center text-gray-800">Verifikasi Email</h3>
            <p className="text-center text-gray-600 text-sm mt-2">
              Masukkan kode OTP yang telah dikirim ke
            </p>
            <p className="text-center text-blue-600 font-semibold text-sm">
              {otpData.email}
            </p>
            
            {submitting ? (
              <div className="text-center mt-8">
                <Spinner />
                <p className="mt-4 text-gray-600">Memverifikasi...</p>
              </div>
            ) : (
              <form className="mt-6" onSubmit={onVerifyOtp}>
                <div className="mt-4">
                  <label className="block text-gray-700 text-center mb-4">
                    Kode Verifikasi OTP
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan 6 digit kode OTP"
                    name="otp"
                    value={otp}
                    onChange={onOtpChange}
                    className="w-full px-4 py-3 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-center text-lg font-mono tracking-widest"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    required
                    disabled={submitting}
                    autoComplete="one-time-code"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Kode terdiri dari 6 digit angka
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || otp.length !== 6}
                  >
                    {submitting ? 'Memverifikasi...' : 'Verifikasi'}
                  </button>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Tidak menerima kode?{' '}
                    <button
                      type="button"
                      onClick={onResendOtp}
                      className={`text-blue-600 hover:underline font-medium ${
                        resendCooldown > 0 || submitting 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                      disabled={resendCooldown > 0 || submitting}
                    >
                      {resendCooldown > 0 
                        ? `Kirim ulang (${resendCooldown}s)` 
                        : 'Kirim ulang kode'
                      }
                    </button>
                  </p>
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('login');
                      setOtpData({ otp: '', email: '' });
                    }}
                    className="text-gray-600 hover:underline text-sm"
                    disabled={submitting}
                  >
                    ← Kembali ke login
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
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

export default connect(mapStateToProps, { login, verifyOTP, resendOTP, setAlert })(Login);