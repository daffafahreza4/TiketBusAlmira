import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_ADMIN_ROUTES,
  GET_ADMIN_ROUTE,
  ADD_ADMIN_ROUTE,
  UPDATE_ADMIN_ROUTE,
  DELETE_ADMIN_ROUTE,
  ROUTE_ADMIN_ERROR,
  CLEAR_ROUTE_ADMIN
} from '../types';

// Get all routes for admin
export const getAllAdminRoutes = () => async dispatch => {
  try {
    const res = await axios.get('/api/admin/routes');

    dispatch({
      type: GET_ADMIN_ROUTES,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data rute';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ROUTE_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Get route by ID for admin
export const getAdminRouteById = (routeId) => async dispatch => {
  try {
    const res = await axios.get(`/api/admin/routes/${routeId}`);
    
    dispatch({
      type: GET_ADMIN_ROUTE,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data rute';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ROUTE_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Create new route
export const createAdminRoute = (routeData) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.post('/api/admin/routes', routeData, config);
    
    dispatch({
      type: ADD_ADMIN_ROUTE,
      payload: res.data.data
    });
    
    dispatch(setAlert('Rute berhasil ditambahkan', 'success'));
    
    // Refresh route list
    dispatch(getAllAdminRoutes());
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat menambahkan rute';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ROUTE_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Update route
export const updateAdminRoute = (routeId, routeData) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(`/api/admin/routes/${routeId}`, routeData, config);
    
    dispatch({
      type: UPDATE_ADMIN_ROUTE,
      payload: res.data.data
    });
    
    dispatch(setAlert('Rute berhasil diperbarui', 'success'));
    
    // Refresh route list
    dispatch(getAllAdminRoutes());
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat memperbarui rute';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ROUTE_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Delete route
export const deleteAdminRoute = (routeId) => async dispatch => {
  try {
    await axios.delete(`/api/admin/routes/${routeId}`);
    
    dispatch({
      type: DELETE_ADMIN_ROUTE,
      payload: routeId
    });
    
    dispatch(setAlert('Rute berhasil dihapus', 'success'));
    
    // Refresh route list
    dispatch(getAllAdminRoutes());
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat menghapus rute';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ROUTE_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Clear route admin data
export const clearRouteAdminData = () => {
  return {
    type: CLEAR_ROUTE_ADMIN
  };
};