import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_BOOKING_SUMMARY,
  CREATE_BOOKING_SUCCESS,
  BOOKING_ERROR,
  CLEAR_BOOKING
} from '../types';

// Get booking summary from reservation
export const getBookingSummary = (reservationId) => async dispatch => {
  try {
    const res = await axios.get(`/api/booking/summary/${reservationId}`);

    dispatch({
      type: GET_BOOKING_SUMMARY,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil ringkasan booking';
    
    dispatch({
      type: BOOKING_ERROR,
      payload: errorMsg
    });
  }
};

// Create booking from reservation (convert reservation to ticket)
export const createBookingFromReservation = (bookingData) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.post('/api/booking/from-reservation', bookingData, config);

    dispatch({
      type: CREATE_BOOKING_SUCCESS,
      payload: res.data.data
    });

    dispatch(setAlert('Pemesanan berhasil! Tiket Anda telah dibuat.', 'success'));

    return res.data.data;
  } catch (err) {
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat membuat booking';

    dispatch(setAlert(errorMsg, 'danger'));

    dispatch({
      type: BOOKING_ERROR,
      payload: errorMsg
    });
    
    throw err;
  }
};

// Clear booking data
export const clearBookingData = () => {
  return {
    type: CLEAR_BOOKING
  };
};