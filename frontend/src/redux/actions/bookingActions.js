import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_BOOKING_SUMMARY,
  CREATE_BOOKING_SUCCESS,
  BOOKING_ERROR,
  CLEAR_BOOKING
} from '../types';

// Create booking from reservation (convert reservation to ticket)
export const createBookingFromReservation = (bookingData) => async dispatch => {
  try {
    console.log('🔍 [bookingActions] Creating booking from reservation:', bookingData);
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Try the booking endpoint first
    try {
      const res = await axios.post('/api/booking/from-reservation', bookingData, config);
      
      console.log('✅ [bookingActions] Booking created from reservation:', res.data);

      dispatch({
        type: CREATE_BOOKING_SUCCESS,
        payload: res.data.data
      });

      dispatch(setAlert('Pemesanan berhasil! Tiket Anda telah dibuat.', 'success'));

      return res.data.data.ticket || res.data.data;
    } catch (bookingError) {
      console.log('⚠️ [bookingActions] Booking endpoint not available, trying direct ticket creation...');
      
      // Fallback: Create ticket directly
      const ticketData = {
        id_rute: bookingData.id_rute,
        nomor_kursi: Array.isArray(bookingData.nomor_kursi) ? 
          bookingData.nomor_kursi[0] : bookingData.nomor_kursi,
        metode_pembayaran: 'midtrans'
      };
      
      const res = await axios.post('/api/booking/direct', ticketData, config);
      
      console.log('✅ [bookingActions] Direct ticket created:', res.data);

      dispatch({
        type: CREATE_BOOKING_SUCCESS,
        payload: res.data.data
      });

      dispatch(setAlert('Tiket berhasil dibuat!', 'success'));

      return res.data.data.ticket || res.data.data;
    }
  } catch (err) {
    console.error('❌ [bookingActions] Create booking error:', err.response);
    
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

// Get booking summary from reservation
export const getBookingSummary = (reservationId) => async dispatch => {
  try {
    console.log('🔍 [bookingActions] Fetching booking summary for:', reservationId);
    
    // Try the booking summary endpoint first
    try {
      const res = await axios.get(`/api/booking/summary/${reservationId}`);
      
      console.log('✅ [bookingActions] Booking summary fetched:', res.data);

      dispatch({
        type: GET_BOOKING_SUMMARY,
        payload: res.data.data
      });
      
      return res.data.data;
    } catch (summaryError) {
      console.log('⚠️ [bookingActions] Booking summary not available, trying reservation endpoint...');
      
      // Fallback: Get reservation data
      const res = await axios.get(`/api/reservasi/${reservationId}`);
      
      console.log('✅ [bookingActions] Reservation data fetched as summary:', res.data);

      dispatch({
        type: GET_BOOKING_SUMMARY,
        payload: res.data.data
      });
      
      return res.data.data;
    }
  } catch (err) {
    console.error('❌ [bookingActions] Get booking summary error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil ringkasan booking';
    
    dispatch({
      type: BOOKING_ERROR,
      payload: errorMsg
    });
    
    // Don't throw error, let component handle missing data gracefully
    return null;
  }
};

// Clear booking data
export const clearBookingData = () => {
  console.log('🔍 [bookingActions] Clearing booking data');
  
  return {
    type: CLEAR_BOOKING
  };
};