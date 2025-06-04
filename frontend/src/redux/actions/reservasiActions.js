import axios from 'axios';
import { setAlert } from './alertActions';
import {
  CREATE_RESERVASI,
  GET_RESERVASI,
  CANCEL_RESERVASI,
  RESERVASI_ERROR,
  CLEAR_RESERVASI
} from '../types';

// Create temporary reservation (FIXED VERSION)
export const createTempReservation = (reservationData) => async dispatch => {
  try {
    console.log('🔍 [reservasiActions] Creating reservation:', reservationData);
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Try temporary reservation endpoint first
    try {
      const res = await axios.post('/api/reservasi/temp', reservationData, config);
      
      console.log('✅ [reservasiActions] Temporary reservation created:', res.data);
      
      dispatch({
        type: CREATE_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Kursi berhasil direservasi', 'success'));
      
      // FIXED: Return proper reservation data structure with seats preserved
      return {
        success: true,
        reservations: res.data.data.reservations || res.data.data,
        route: res.data.data.route,
        reservedSeats: res.data.data.reservedSeats || reservationData.nomor_kursi,
        // Keep original seat data
        originalSeats: reservationData.nomor_kursi
      };
      
    } catch (tempError) {
      console.log('⚠️ [reservasiActions] Temp reservation not available, using direct booking...');
      
      // Fallback: Create ticket directly
      const ticketData = {
        id_rute: reservationData.id_rute,
        nomor_kursi: Array.isArray(reservationData.nomor_kursi) ? 
          reservationData.nomor_kursi[0] : reservationData.nomor_kursi, // Take first seat for compatibility
        metode_pembayaran: 'midtrans'
      };
      
      const res = await axios.post('/api/booking/direct', ticketData, config);
      
      console.log('✅ [reservasiActions] Direct ticket created:', res.data);
      
      dispatch({
        type: CREATE_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Tiket berhasil dibuat', 'success'));
      
      // Return ticket data in reservation format with all seats preserved
      return {
        success: true,
        ticket: res.data.data.ticket,
        route: res.data.data.ticket?.Rute,
        reservedSeats: reservationData.nomor_kursi, // FIXED: Keep all original seats
        originalSeats: reservationData.nomor_kursi
      };
    }
  } catch (err) {
    console.error('❌ [reservasiActions] Create reservation error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat membuat reservasi';

    dispatch(setAlert(errorMsg, 'danger'));

    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
    
    throw err;
  }
};

// Get booking summary (FIXED VERSION)
export const getBookingSummary = (reservationId) => async dispatch => {
  try {
    console.log('🔍 [reservasiActions] Fetching booking summary for:', reservationId);
    
    // Try booking summary endpoint first
    try {
      const res = await axios.get(`/api/booking/summary/${reservationId}`);
      console.log('✅ [reservasiActions] Booking summary fetched:', res.data);

      const summaryData = res.data.data;
      
      // FIXED: Ensure seat data is properly formatted
      if (summaryData && summaryData.nomor_kursi) {
        if (typeof summaryData.nomor_kursi === 'string') {
          // If it's a comma-separated string, split it
          summaryData.nomor_kursi = summaryData.nomor_kursi.split(',').map(seat => seat.trim());
        } else if (!Array.isArray(summaryData.nomor_kursi)) {
          // If it's a single value, make it an array
          summaryData.nomor_kursi = [summaryData.nomor_kursi];
        }
      }

      dispatch({
        type: GET_RESERVASI,
        payload: summaryData
      });
      
      return summaryData;
    } catch (summaryError) {
      console.log('⚠️ [reservasiActions] Booking summary not available, trying reservasi...');
      
      // Fallback to reservation endpoint
      const res = await axios.get(`/api/reservasi/${reservationId}`);
      console.log('✅ [reservasiActions] Reservation data fetched:', res.data);

      const reservationData = res.data.data;
      
      // FIXED: Ensure seat data is properly formatted
      if (reservationData && reservationData.nomor_kursi) {
        if (typeof reservationData.nomor_kursi === 'string') {
          // If it's a comma-separated string, split it
          reservationData.nomor_kursi = reservationData.nomor_kursi.split(',').map(seat => seat.trim());
        } else if (!Array.isArray(reservationData.nomor_kursi)) {
          // If it's a single value, make it an array
          reservationData.nomor_kursi = [reservationData.nomor_kursi];
        }
      }

      dispatch({
        type: GET_RESERVASI,
        payload: reservationData
      });
      
      return reservationData;
    }
  } catch (err) {
    console.error('❌ [reservasiActions] Get booking summary error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil ringkasan booking';
    
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
    
    throw err;
  }
};

// Get user's reservations
export const getUserReservations = () => async dispatch => {
  try {
    console.log('🔍 [reservasiActions] Fetching user reservations...');
    
    // Try reservasi endpoint first, fallback to tickets
    try {
      const res = await axios.get('/api/reservasi/user');
      console.log('✅ [reservasiActions] User reservations fetched:', res.data);

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    } catch (reservasiError) {
      console.log('⚠️ [reservasiActions] Reservasi endpoint not available, trying tickets...');
      
      const res = await axios.get('/api/tiket/my-tickets');
      console.log('✅ [reservasiActions] User tickets fetched as reservations:', res.data);

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    }
  } catch (err) {
    console.error('❌ [reservasiActions] Get user reservations error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data reservasi';
    
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
  }
};

// Cancel reservation
export const cancelReservation = (reservationId) => async dispatch => {
  try {
    console.log('🔍 [reservasiActions] Cancelling reservation:', reservationId);
    
    // Try cancel reservation first, fallback to cancel ticket
    try {
      const res = await axios.put(`/api/reservasi/cancel/${reservationId}`);
      console.log('✅ [reservasiActions] Reservation cancelled:', res.data);

      dispatch({
        type: CANCEL_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Reservasi berhasil dibatalkan', 'success'));
    } catch (reservasiError) {
      console.log('⚠️ [reservasiActions] Reservasi cancel not available, trying ticket cancel...');
      
      const res = await axios.put(`/api/tiket/cancel/${reservationId}`);
      console.log('✅ [reservasiActions] Ticket cancelled:', res.data);

      dispatch({
        type: CANCEL_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Tiket berhasil dibatalkan', 'success'));
    }
  } catch (err) {
    console.error('❌ [reservasiActions] Cancel reservation error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat membatalkan reservasi';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
  }
};

// Clear reservation data
export const clearReservationData = () => {
  console.log('🔍 [reservasiActions] Clearing reservation data');
  
  return {
    type: CLEAR_RESERVASI
  };
};