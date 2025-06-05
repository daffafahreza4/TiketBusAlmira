import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_BUSES,
  GET_BUS,
  ADD_BUS,
  UPDATE_BUS,
  DELETE_BUS,
  BUS_ERROR,
  CLEAR_BUS
} from '../types';

// Get all buses
export const getAllBuses = () => async dispatch => {
  try {
    const res = await axios.get('/api/admin/buses');
    
    dispatch({
      type: GET_BUSES,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data bus';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: BUS_ERROR,
      payload: errorMsg
    });
  }
};

// Get bus by ID
export const getBusById = (busId) => async dispatch => {
  try {
    const res = await axios.get(`/api/admin/buses/${busId}`);
    
    dispatch({
      type: GET_BUS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data bus';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: BUS_ERROR,
      payload: errorMsg
    });
  }
};

// Create new bus
export const createBus = (busData) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.post('/api/admin/buses', busData, config);
    
    dispatch({
      type: ADD_BUS,
      payload: res.data.data
    });
    
    dispatch(setAlert('Bus berhasil ditambahkan', 'success'));
    
    // Refresh bus list
    dispatch(getAllBuses());
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menambahkan bus';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: BUS_ERROR,
      payload: errorMsg
    });
  }
};

// Update bus
export const updateBus = (busId, busData) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.put(`/api/admin/buses/${busId}`, busData, config);
    
    dispatch({
      type: UPDATE_BUS,
      payload: res.data.data
    });
    
    dispatch(setAlert('Bus berhasil diperbarui', 'success'));
    
    // Refresh bus list
    dispatch(getAllBuses());
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat memperbarui bus';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: BUS_ERROR,
      payload: errorMsg
    });
  }
};

// Delete bus
export const deleteBus = (busId) => async dispatch => {
  try {
    await axios.delete(`/api/admin/buses/${busId}`);
    
    dispatch({
      type: DELETE_BUS,
      payload: busId
    });
    
    dispatch(setAlert('Bus berhasil dihapus', 'success'));
    
    // Refresh bus list
    dispatch(getAllBuses());
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menghapus bus';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: BUS_ERROR,
      payload: errorMsg
    });
  }
};

// Clear bus data
export const clearBusData = () => ({ type: CLEAR_BUS });