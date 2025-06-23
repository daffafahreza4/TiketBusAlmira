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

// Cancel reservation (ENHANCED VERSION)
export const cancelReservation = (reservationId) => async dispatch => {
  try {
    // Try cancel reservation first, fallback to cancel ticket
    try {
      const res = await axios.put(`/api/reservasi/cancel/${reservationId}`);

      dispatch({
        type: CANCEL_RESERVASI,
        payload: res.data.data
      });

      console.log(`✅ Reservation ${reservationId} cancelled successfully`);
      return {
        success: true,
        data: res.data.data,
        type: 'reservation'
      };
    } catch (reservasiError) {
      // If reservation endpoint fails, try ticket endpoint
      if (reservasiError.response?.status === 404) {
        const res = await axios.put(`/api/tiket/cancel/${reservationId}`);

        dispatch({
          type: CANCEL_RESERVASI,
          payload: res.data.data
        });

        console.log(`✅ Ticket ${reservationId} cancelled successfully`);
        return {
          success: true,
          data: res.data.data,
          type: 'ticket'
        };
      }
      
      throw reservasiError;
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membatalkan reservasi';
    
    console.warn(`❌ Failed to cancel reservation ${reservationId}:`, errorMsg);
    
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
    
    return {
      success: false,
      error: errorMsg,
      reservationId
    };
  }
};

// TAMBAH: Batch cancel multiple reservations
export const cancelMultipleReservations = (reservationIds) => async dispatch => {
  try {
    if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
      return {
        success: true,
        results: [],
        summary: { cancelled: 0, failed: 0, total: 0 }
      };
    }

    console.log(`🧹 Starting batch cancel for ${reservationIds.length} reservations:`, reservationIds);

    // Cancel each reservation individually
    const cancelPromises = reservationIds.map(async (reservationId) => {
      try {
        const result = await dispatch(cancelReservation(reservationId));
        return {
          reservationId,
          success: result.success,
          type: result.type,
          error: null
        };
      } catch (error) {
        return {
          reservationId,
          success: false,
          type: null,
          error: error.message || 'Unknown error'
        };
      }
    });

    // Wait for all cancellations to complete
    const results = await Promise.all(cancelPromises);
    
    // Calculate summary
    const summary = results.reduce((acc, result) => {
      acc.total++;
      if (result.success) {
        acc.cancelled++;
      } else {
        acc.failed++;
      }
      return acc;
    }, { cancelled: 0, failed: 0, total: 0 });

    console.log(`🧹 Batch cancel completed:`, summary);

    // Show appropriate alert
    if (summary.cancelled > 0) {
      if (summary.failed === 0) {
        dispatch(setAlert(`${summary.cancelled} reservasi berhasil dibatalkan`, 'success'));
      } else {
        dispatch(setAlert(`${summary.cancelled} dari ${summary.total} reservasi berhasil dibatalkan`, 'warning'));
      }
    } else if (summary.failed > 0) {
      dispatch(setAlert('Gagal membatalkan reservasi', 'danger'));
    }

    return {
      success: summary.cancelled > 0,
      results,
      summary
    };

  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membatalkan reservasi batch';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: RESERVASI_ERROR,
      payload: errorMsg
    });
    
    return {
      success: false,
      error: errorMsg,
      results: [],
      summary: { cancelled: 0, failed: reservationIds.length, total: reservationIds.length }
    };
  }
};

// TAMBAH: Cancel all user reservations for specific route
export const cancelAllReservationsForRoute = (routeId) => async dispatch => {
  try {
    if (!routeId) {
      return { success: false, error: 'Route ID is required' };
    }

    // Get stored reservation IDs for this route
    const storedReservations = sessionStorage.getItem(`reservations_${routeId}`);
    
    if (!storedReservations) {
      console.log('📝 No stored reservations found for route:', routeId);
      return {
        success: true,
        summary: { cancelled: 0, failed: 0, total: 0 }
      };
    }

    const reservationIds = JSON.parse(storedReservations);
    
    // Use batch cancel
    const result = await dispatch(cancelMultipleReservations(reservationIds));
    
    // Clear stored reservations if any were cancelled
    if (result.success) {
      sessionStorage.removeItem(`reservations_${routeId}`);
      console.log(`🧹 Cleared stored reservations for route: ${routeId}`);
    }
    
    return result;

  } catch (error) {
    console.error('Error cancelling reservations for route:', error);
    
    const errorMsg = 'Terjadi kesalahan saat membatalkan reservasi untuk rute ini';
    dispatch(setAlert(errorMsg, 'danger'));
    
    return {
      success: false,
      error: errorMsg
    };
  }
};

// TAMBAH: Silent cancel (without alerts - for cleanup purposes)
export const silentCancelReservation = (reservationId) => async () => {
  try {
    // Try cancel reservation first, fallback to cancel ticket
    try {
      await axios.put(`/api/reservasi/cancel/${reservationId}`);
      console.log(`🔇 Silent cancel reservation ${reservationId} successful`);
      return { success: true, type: 'reservation' };
    } catch (reservasiError) {
      if (reservasiError.response?.status === 404) {
        await axios.put(`/api/tiket/cancel/${reservationId}`);
        console.log(`🔇 Silent cancel ticket ${reservationId} successful`);
        return { success: true, type: 'ticket' };
      }
      throw reservasiError;
    }
  } catch (err) {
    console.warn(`🔇 Silent cancel failed for ${reservationId}:`, err.response?.data?.message || err.message);
    return {
      success: false,
      error: err.response?.data?.message || err.message
    };
  }
};

// Clear reservation data
export const clearReservationData = () => ({ type: CLEAR_RESERVASI });