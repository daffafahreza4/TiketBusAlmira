import axios from 'axios';
import { setAlert } from './alertActions';
import {
  USER_LOADED,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  AUTH_ERROR,
  LOGOUT
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
    // Clear token on authentication error
    setAuthToken(null);
    dispatch({ type: AUTH_ERROR });
  }
};

// Register User
export const register = formData => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

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

    // Extract token from response
    const token = res.data.data?.token;

    if (token) {
      // Set token and load user
      setAuthToken(token);
      dispatch(loadUser());
    }
    
    dispatch(setAlert('Registrasi berhasil', 'success'));
  } catch (err) {
    const errors = err.response && err.response.data.errors;
    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    } else {
      dispatch(setAlert(err.response?.data?.message || 'Registration failed', 'danger'));
    }

    dispatch({
      type: REGISTER_FAIL,
      payload: err.response?.data?.message || 'Server error'
    });
  }
};

// Login User
export const login = (email, password) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const body = JSON.stringify({ email, password });

    const res = await axios.post('/api/auth/login', body, config);

    // Extract token from response
    const token = res.data.data?.token;

    if (!token) {
      dispatch(setAlert('Login failed: No token received', 'danger'));
      return;
    }

    // Dispatch login success
    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    // Set token to headers and localStorage
    setAuthToken(token);

    // Load user profile immediately after login
    await dispatch(loadUser());

    dispatch(setAlert('Login berhasil', 'success'));
  } catch (err) {
    dispatch(setAlert(err.response?.data?.message || 'Login failed', 'danger'));

    dispatch({
      type: LOGIN_FAIL,
      payload: err.response?.data?.message || 'Server error'
    });
  }
};

// Logout
export const logout = () => dispatch => {
  setAuthToken(null);
  dispatch({ type: LOGOUT });
  dispatch(setAlert('Logout berhasil', 'success'));
};