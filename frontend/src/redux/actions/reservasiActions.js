import axios from 'axios';
import { setAlert } from './alertActions';
import {
  CREATE_RESERVASI,
  GET_RESERVASI,
  CANCEL_RESERVASI,
  RESERVASI_ERROR
} from '../types';

// Create a new reservation
export const createReservation = (reservationData, navigate) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Create temporary reservation to hold seats
    const tempRes = await axios.post('/api/reservasi/temp', reservationData, config);
    
    // Display success message
    dispatch(setAlert('Reservasi berhasil dibuat', 'success'));

    // Dispatch action to update state
    dispatch({
      type: CREATE_RESERVASI,
      payload: tempRes.data.data
    });

    // Redirect to payment page
    if (navigate) {
      navigate(`/payment/${tempRes.data.data.id_reservasi}`);
    }
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat membuat reservasi';

    dispatch(setAlert(errorMsg, 'danger'));

    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
  }
};

// Get user reservations
export const getUserReservations = () => async dispatch => {
  try {
    const res = await axios.get('/api/reservasi/user');

    dispatch({
      type: GET_RESERVASI,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: RESERVASI_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data reservasi'
    });
  }
};

// Get reservation by id
export const getReservationById = id => async dispatch => {
  try {
    const res = await axios.get(`/api/reservasi/${id}`);

    dispatch({
      type: GET_RESERVASI,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: RESERVASI_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data reservasi'
    });
  }
};

// Cancel reservation
export const cancelReservation = id => async dispatch => {
  try {
    const res = await axios.put(`/api/reservasi/cancel/${id}`);

    dispatch({
      type: CANCEL_RESERVASI,
      payload: res.data.data
    });

    dispatch(setAlert('Reservasi berhasil dibatalkan', 'success'));
  } catch (err) {
    dispatch({
      type: RESERVASI_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat membatalkan reservasi'
    });
  }
};