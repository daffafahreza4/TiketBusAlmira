import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_ADMIN_STATS,
  GET_ALL_USERS,
  DELETE_USER_SUCCESS,
  MAKE_USER_ADMIN_SUCCESS,
  ADMIN_ERROR,
  CLEAR_ADMIN_DATA,
  UPDATE_USER_SUCCESS
} from '../types';

// Get admin dashboard stats
export const getAdminDashboardStats = () => async dispatch => {
  try {
    const res = await axios.get('/api/admin/dashboard/stats');
    
    dispatch({
      type: GET_ADMIN_STATS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data admin';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Get all users
export const getAllUsers = () => async dispatch => {
  try {
    const res = await axios.get('/api/admin/users');
    
    dispatch({
      type: GET_ALL_USERS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data user';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Delete user
export const deleteUser = (userId) => async dispatch => {
  try {
    await axios.delete(`/api/admin/users/${userId}`);
    
    dispatch({
      type: DELETE_USER_SUCCESS,
      payload: userId
    });
    
    dispatch(setAlert('User berhasil dihapus', 'success'));
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menghapus user';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Make user admin
export const makeUserAdmin = (userId) => async dispatch => {
  try {
    const res = await axios.put(`/api/auth/make-admin/${userId}`);
    
    dispatch({
      type: MAKE_USER_ADMIN_SUCCESS,
      payload: res.data.data
    });
    
    dispatch(setAlert('User berhasil dijadikan admin', 'success'));
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membuat admin';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Update user
export const updateUser = (userId, userData) => async dispatch => {
  try {
    const config = {
      headers: { 'Content-Type': 'application/json' }
    };

    const res = await axios.put(`/api/admin/users/${userId}`, userData, config);
    
    dispatch({
      type: UPDATE_USER_SUCCESS,
      payload: res.data.data
    });
    
    dispatch(setAlert('User berhasil diperbarui', 'success'));
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat memperbarui user';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Clear admin data
export const clearAdminData = () => ({ type: CLEAR_ADMIN_DATA });