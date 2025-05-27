import axios from 'axios';
import { setAlert } from './alertActions';
import {
  CREATE_RESERVASI,
  GET_RESERVASI,
  CANCEL_RESERVASI,
  RESERVASI_ERROR,
  CLEAR_RESERVASI
} from '../types';

// Create temporary reservation (fallback to direct booking if temp reservation not available)
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
      return res.data.data;
      
    } catch (tempError) {
      console.log('⚠️ [reservasiActions] Temp reservation not available, trying direct booking...');
      
      // Fallback: Create regular reservation/booking
      const bookingData = {
        id_rute: reservationData.id_rute,
        nomor_kursi: reservationData.nomor_kursi,
        nama_penumpang: 'Temporary',
        email: 'temp@temp.com',
        no_telepon: '0000000000'
      };
      
      const res = await axios.post('/api/tiket', bookingData, config);
      
      console.log('✅ [reservasiActions] Direct booking created:', res.data);
      
      dispatch({
        type: CREATE_RESERVASI,
        payload: res.data.data
      });

      dispatch(setAlert('Kursi berhasil dipesan', 'success'));
      return res.data.data;
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

// Create a new reservation (original function kept for compatibility)
export const createReservation = (reservationData, navigate) => async dispatch => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Create reservation/booking
    const res = await axios.post('/api/tiket', reservationData, config);
    
    // Display success message
    dispatch(setAlert('Reservasi berhasil dibuat', 'success'));

    // Dispatch action to update state
    dispatch({
      type: CREATE_RESERVASI,
      payload: res.data.data
    });

    // Redirect to ticket detail page if navigate provided
    if (navigate && res.data.data.id_tiket) {
      navigate(`/ticket/${res.data.data.id_tiket}`);
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

// Get reservation by ID
export const getReservationById = (reservationId) => async dispatch => {
  try {
    console.log('🔍 [reservasiActions] Fetching reservation by ID:', reservationId);
    
    // Try reservasi endpoint first, fallback to ticket
    try {
      const res = await axios.get(`/api/reservasi/${reservationId}`);
      console.log('✅ [reservasiActions] Reservation fetched:', res.data);

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    } catch (reservasiError) {
      console.log('⚠️ [reservasiActions] Reservasi endpoint not available, trying ticket...');
      
      const res = await axios.get(`/api/tiket/${reservationId}`);
      console.log('✅ [reservasiActions] Ticket fetched as reservation:', res.data);

      dispatch({
        type: GET_RESERVASI,
        payload: res.data.data
      });
    }
  } catch (err) {
    console.error('❌ [reservasiActions] Get reservation by ID error:', err.response);
    
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