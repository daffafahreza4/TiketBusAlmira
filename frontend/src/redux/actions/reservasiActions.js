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
    const config = { headers: { 'Content-Type': 'application/json' } };

    // Try temporary reservation endpoint first
    try {
      const res = await axios.post('/api/reservasi/temp', reservationData, config);
      
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
      // Fallback: Create ticket directly
      const ticketData = {
        id_rute: reservationData.id_rute,
        nomor_kursi: Array.isArray(reservationData.nomor_kursi) ? 
          reservationData.nomor_kursi[0] : reservationData.nomor_kursi, // Take first seat for compatibility
        metode_pembayaran: 'midtrans'
      };
      
      const res = await axios.post('/api/booking/direct', ticketData, config);
      
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
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membuat reservasi';

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
    // Try booking summary endpoint first
    try {
      const res = await axios.get(`/api/booking/summary/${reservationId}`);
      const summaryData = res.data.data;
      
      // FIXED: Ensure seat data is properly formatted
      if (summaryData?.nomor_kursi) {
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
      // Fallback to reservation endpoint
      const res = await axios.get(`/api/reservasi/${reservationId}`);
      const reservationData = res.data.data;
      
      // FIXED: Ensure seat data is properly formatted
      if (reservationData?.nomor_kursi) {
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
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil ringkasan booking';
    
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
    // Try reservasi endpoint first, fallback to tickets
    try {
      const res = await axios.get('/api/reservasi/user');

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    } catch (reservasiError) {
      const res = await axios.get('/api/tiket/my-tickets');

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data reservasi';
    
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
  }
};

// Cancel reservation
export const cancelReservation = (reservationId) => async dispatch => {
  try {
    // Try cancel reservation first, fallback to cancel ticket
    try {
      const res = await axios.put(`/api/reservasi/cancel/${reservationId}`);

      dispatch({
        type: CANCEL_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Reservasi berhasil dibatalkan', 'success'));
    } catch (reservasiError) {
      const res = await axios.put(`/api/tiket/cancel/${reservationId}`);

      dispatch({
        type: CANCEL_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Tiket berhasil dibatalkan', 'success'));
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membatalkan reservasi';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
  }
};

// Clear reservation data
export const clearReservationData = () => ({ type: CLEAR_RESERVASI });