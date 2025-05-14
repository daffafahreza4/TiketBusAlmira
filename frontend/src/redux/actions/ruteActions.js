import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_RUTES,
  GET_RUTE,
  SEARCH_RUTES,
  RUTE_ERROR,
  CLEAR_RUTE
} from '../types';

// Get all routes
export const getRutes = () => async dispatch => {
  try {
    const res = await axios.get('/api/rute');

    dispatch({
      type: GET_RUTES,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: RUTE_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data rute'
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
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data rute'
    });
  }
};

// Search routes
export const searchRoutes = searchParams => async dispatch => {
  try {
    const { asal, tujuan, tanggal } = searchParams;

    // Store search params in reducer
    dispatch({
      type: SEARCH_RUTES,
      payload: {
        routes: [], // We'll fill this after the API call
        searchParams
      }
    });

    const res = await axios.get(
      `/api/rute/search?asal=${asal}&tujuan=${tujuan}&tanggal=${tanggal}`
    );

    dispatch({
      type: SEARCH_RUTES,
      payload: {
        routes: res.data.data,
        searchParams
      }
    });
  } catch (err) {
    dispatch({
      type: RUTE_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mencari rute'
    });
  }
};

// Clear route
export const clearRoute = () => {
  return {
    type: CLEAR_RUTE
  };
};