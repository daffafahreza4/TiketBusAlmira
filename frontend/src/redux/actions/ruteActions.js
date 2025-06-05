import axios from 'axios';
import {
  GET_RUTES,
  GET_RUTE,
  RUTE_ERROR,
  CLEAR_RUTE
} from '../types';

// Get all routes
export const getRutes = () => async dispatch => {
  try {
    dispatch({ type: CLEAR_RUTE }); // Clear previous state
    
    const res = await axios.get('/api/rute');

    dispatch({
      type: GET_RUTES,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: RUTE_ERROR,
      payload: err.response?.data?.message || 'Terjadi kesalahan saat mengambil data rute'
    });
  }
};

// Get route by id
export const getRouteById = id => async dispatch => {
  try {
    const res = await axios.get(`/api/rute/${id}`);

    dispatch({
      type: GET_RUTE,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: RUTE_ERROR,
      payload: err.response?.data?.message || 'Terjadi kesalahan saat mengambil data rute'
    });
  }
};

// Clear route
export const clearRoute = () => ({ type: CLEAR_RUTE });