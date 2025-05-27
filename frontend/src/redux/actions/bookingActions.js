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
    console.log('🔍 Fetching booking summary for reservation:', reservationId);
    
    const res = await axios.get(`/api/booking/summary/${reservationId}`);
    
    console.log('✅ Booking summary fetched:', res.data);

    dispatch({
      type: GET_BOOKING_SUMMARY,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ Get booking summary error:', err.response);
    
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
    console.log('🔍 Creating booking from reservation:', bookingData);
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.post('/api/booking/from-reservation', bookingData, config);
    
    console.log('✅ Booking created from reservation:', res.data);

    dispatch({
      type: CREATE_BOOKING_SUCCESS,
      payload: res.data.data
    });

    dispatch(setAlert('Pemesanan berhasil! Tiket Anda telah dibuat.', 'success'));

    return res.data.data;
  } catch (err) {
    console.error('❌ Create booking from reservation error:', err.response);
    
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