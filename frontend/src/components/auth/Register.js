import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { register, verifyOTP, resendOTP } from '../../redux/actions/authActions';
import { setAlert } from '../../redux/actions/alertActions';
import Spinner from '../layout/Spinner';

const Register = ({ register, verifyOTP, resendOTP, isAuthenticated, loading, setAlert }) => {
  const [currentStep, setCurrentStep] = useState('register'); // 'register' | 'verify'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    phone: ''
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { name, email, password, password2, phone } = formData;
  const { otp } = otpData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onOtpChange = e =>
    setOtpData({ ...otpData, [e.target.name]: e.target.value });

  // Handle registration form submission
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

    setSubmitting(true);
    
    try {
      const result = await register(formData);
      
      if (result && result.requiresVerification) {
        setOtpData({ ...otpData, email: result.email });
        setCurrentStep('verify');
        setAlert('Kode OTP telah dikirim ke email Anda', 'success');
      }
    } catch (error) {
      // Error handling sudah dilakukan di action
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

  // Redirect jika sudah login
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-full max-w-md">
        {currentStep === 'register' ? (
          <>
            <h3 className="text-2xl font-bold text-center text-gray-800">Daftar Akun</h3>
            <p className="text-center text-gray-600 text-sm mt-2">
              Buat akun baru untuk menikmati layanan Almira Travel
            </p>
            
            {loading || submitting ? (
              <div className="text-center mt-8">
                <Spinner />
                <p className="mt-4 text-gray-600">
                  {submitting ? 'Mendaftarkan akun...' : 'Memuat...'}
                </p>
              </div>
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
                    disabled={submitting}
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
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kode verifikasi akan dikirim ke email ini
                  </p>
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
                    minLength="6"
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal 6 karakter
                  </p>
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
                    disabled={submitting}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting}
                  >
                    {submitting ? 'Mendaftar...' : 'Daftar'}
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                      Login
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
            
            {loading || submitting ? (
              <div className="text-center mt-8">
                <Spinner />
                <p className="mt-4 text-gray-600">
                  {submitting ? 'Memverifikasi...' : 'Memuat...'}
                </p>
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
                      setCurrentStep('register');
                      setOtpData({ otp: '', email: '' });
                    }}
                    className="text-gray-600 hover:underline text-sm"
                    disabled={submitting}
                  >
                    ← Kembali ke pendaftaran
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

Register.propTypes = {
  register: PropTypes.func.isRequired,
  verifyOTP: PropTypes.func.isRequired,
  resendOTP: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  loading: PropTypes.bool,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  loading: state.auth.loading
});

export default connect(mapStateToProps, { register, verifyOTP, resendOTP, setAlert })(Register);