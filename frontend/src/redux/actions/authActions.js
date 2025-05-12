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
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    const res = await axios.get('/api/auth/profile');

    dispatch({
      type: USER_LOADED,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
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

    dispatch(loadUser());
    dispatch(setAlert('Registrasi berhasil', 'success'));
  } catch (err) {
    const errors = err.response && err.response.data.errors;

    if (errors) {
      errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
    }

    dispatch({
      type: REGISTER_FAIL,
      payload: err.response ? err.response.data.message : 'Server error'
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

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
    dispatch(setAlert('Login berhasil', 'success'));
  } catch (err) {
    dispatch({
      type: LOGIN_FAIL,
      payload: err.response ? err.response.data.message : 'Server error'
    });
  }
};

// Logout
export const logout = () => dispatch => {
  dispatch({ type: LOGOUT });
  dispatch(setAlert('Logout berhasil', 'success'));
};