import axios from 'axios';
import { setAlert } from './alertActions';
import {
  USER_LOADED,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  AUTH_ERROR,
  LOGOUT,
  VERIFY_OTP_SUCCESS,
  VERIFY_OTP_FAIL,
  RESEND_OTP_SUCCESS,
  RESEND_OTP_FAIL
} from '../types';
import setAuthToken from '../../utils/setAuthToken';

// Load User
export const loadUser = () => async dispatch => {
  const token = localStorage.getItem('token');
  
  if (token) {
    setAuthToken(token);
  } else {
    dispatch({ type: AUTH_ERROR });
    return;
  }

  try {
    const res = await axios.get('/api/auth/profile');

    dispatch({
      type: USER_LOADED,
      payload: res.data.data
    });
  } catch (err) {
    setAuthToken(null);
    dispatch({ type: AUTH_ERROR });
  }
};

// Register User
export const register = formData => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };

    const body = JSON.stringify({
      username: formData.name,
      email: formData.email,
      password: formData.password,
      no_telepon: formData.phone
    });

    const res = await axios.post('/api/auth/register', body, config);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });

    // Check if requires verification
    if (res.data.requiresVerification) {
      dispatch(setAlert(res.data.message, 'success'));
      return {
        requiresVerification: true,
        email: res.data.email
      };
    }

    // If registration is complete without verification (shouldn't happen in new flow)
    const token = res.data.data?.token;
    if (token) {
      setAuthToken(token);
      dispatch(loadUser());
    }
    
    dispatch(setAlert('Registrasi berhasil', 'success'));
    return res.data;
  } catch (err) {
    const errors = err.response?.data?.errors;
    
    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    } else {
      dispatch(setAlert(err.response?.data?.message || 'Registration failed', 'danger'));
    }

    dispatch({
      type: REGISTER_FAIL,
      payload: err.response?.data?.message || 'Server error'
    });
    
    throw err;
  }
};

// Verify OTP
export const verifyOTP = ({ email, otp }) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, otp });

    const res = await axios.post('/api/auth/verify-otp', body, config);
    
    const token = res.data.data?.token;
    if (token) {
      setAuthToken(token);
    }

    dispatch({
      type: VERIFY_OTP_SUCCESS,
      payload: res.data
    });

    // Load user profile after verification
    if (token) {
      await dispatch(loadUser());
    }

    dispatch(setAlert(res.data.message || 'Verifikasi berhasil', 'success'));
    return res.data;
  } catch (err) {
    dispatch(setAlert(err.response?.data?.message || 'Verifikasi gagal', 'danger'));

    dispatch({
      type: VERIFY_OTP_FAIL,
      payload: err.response?.data?.message || 'Verification failed'
    });
    
    throw err;
  }
};

// Resend OTP
export const resendOTP = ({ email }) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email });

    const res = await axios.post('/api/auth/resend-otp', body, config);

    dispatch({
      type: RESEND_OTP_SUCCESS,
      payload: res.data
    });

    dispatch(setAlert(res.data.message || 'Kode OTP berhasil dikirim ulang', 'success'));
    return res.data;
  } catch (err) {
    dispatch(setAlert(err.response?.data?.message || 'Gagal mengirim ulang OTP', 'danger'));

    dispatch({
      type: RESEND_OTP_FAIL,
      payload: err.response?.data?.message || 'Resend failed'
    });
    
    throw err;
  }
};

// Login User
export const login = (email, password) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ email, password });

    const res = await axios.post('/api/auth/login', body, config);
    
    // Check if requires verification
    if (res.data.requiresVerification) {
      dispatch(setAlert(res.data.message, 'warning'));
      return {
        requiresVerification: true,
        email: res.data.email
      };
    }

    const token = res.data.data?.token;
    if (!token) {
      dispatch(setAlert('Login failed: No token received', 'danger'));
      return Promise.reject('No token received');
    }

    // Set token to headers and localStorage FIRST
    setAuthToken(token);

    // Dispatch login success
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    // Load user profile immediately after login
    await dispatch(loadUser());

    dispatch(setAlert('Login berhasil', 'success'));
    return Promise.resolve();
  } catch (err) {
    const errorMessage = err.response?.data?.message || 'Login failed';
    dispatch(setAlert(errorMessage, 'danger'));

    // Check if error indicates need for verification
    if (err.response?.data?.requiresVerification) {
      return Promise.reject({
        requiresVerification: true,
        email: err.response.data.email
      });
    }

    dispatch({
      type: LOGIN_FAIL,
      payload: errorMessage
    });
    
    return Promise.reject(err);
  }
};

// Logout
export const logout = () => dispatch => {
  setAuthToken(null);
  dispatch({ type: LOGOUT });
  dispatch(setAlert('Logout berhasil', 'success'));
};