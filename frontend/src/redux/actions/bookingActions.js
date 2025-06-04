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

    // Enhanced booking data with better structure
    const enhancedBookingData = {
      id_reservasi: bookingData.id_reservasi || 'temp',
      id_rute: bookingData.id_rute,
      nomor_kursi: Array.isArray(bookingData.nomor_kursi) ? 
        bookingData.nomor_kursi : [bookingData.nomor_kursi],
      metode_pembayaran: 'midtrans'
    };

    console.log('🔍 [bookingActions] Enhanced booking data:', enhancedBookingData);

    // Try the booking endpoint first
    try {
      const res = await axios.post('/api/booking/from-reservation', enhancedBookingData, config);
      
      console.log('✅ [bookingActions] Booking created from reservation:', res.data);

      dispatch({
        type: CREATE_BOOKING_SUCCESS,
        payload: res.data.data
      });

      // Handle multiple tickets response
      if (res.data.data.tickets && res.data.data.tickets.length > 0) {
        const ticketCount = res.data.data.tickets.length;
        dispatch(setAlert(`${ticketCount} tiket berhasil dibuat! Lanjutkan ke pembayaran.`, 'success'));
        return {
          success: true,
          tickets: res.data.data.tickets,
          ticket: res.data.data.tickets[0], // Return first ticket for compatibility
          id_tiket: res.data.data.tickets[0].id_tiket
        };
      } else {
        dispatch(setAlert('Pemesanan berhasil! Tiket Anda telah dibuat.', 'success'));
        return {
          success: true,
          ticket: res.data.data.ticket,
          id_tiket: res.data.data.ticket?.id_tiket
        };
      }
    } catch (bookingError) {
      console.log('⚠️ [bookingActions] Booking endpoint error:', bookingError.response?.data);
      
      // Check if it's a seat conflict error
      if (bookingError.response?.status === 409) {
        const errorMessage = bookingError.response.data.message || 'Kursi sudah dipesan atau direservasi';
        dispatch(setAlert(errorMessage, 'danger'));
        
        // Return detailed error info for seat conflicts
        throw {
          type: 'SEAT_CONFLICT',
          message: errorMessage,
          conflictSeats: bookingError.response.data.conflictSeats || [],
          status: 409
        };
      }
      
      // For 500 errors, try fallback
      if (bookingError.response?.status === 500) {
        console.log('⚠️ [bookingActions] Server error, trying direct ticket creation...');
        
        // Fallback: Create ticket directly with single seat for compatibility
        const fallbackData = {
          id_rute: enhancedBookingData.id_rute,
          nomor_kursi: enhancedBookingData.nomor_kursi[0], // Take first seat
          metode_pembayaran: 'midtrans'
        };
        
        try {
          const res = await axios.post('/api/booking/direct', fallbackData, config);
          
          console.log('✅ [bookingActions] Direct ticket created:', res.data);

          dispatch({
            type: CREATE_BOOKING_SUCCESS,
            payload: res.data.data
          });

          dispatch(setAlert('Tiket berhasil dibuat!', 'success'));

          return {
            success: true,
            ticket: res.data.data.ticket,
            id_tiket: res.data.data.ticket?.id_tiket
          };
        } catch (directError) {
          console.error('❌ [bookingActions] Direct booking also failed:', directError.response?.data);
          
          // Handle direct booking errors
          if (directError.response?.status === 409) {
            const errorMessage = directError.response.data.message || 'Kursi sudah dipesan atau direservasi';
            dispatch(setAlert(errorMessage, 'danger'));
            
            throw {
              type: 'SEAT_CONFLICT',
              message: errorMessage,
              status: 409
            };
          }
          
          throw directError;
        }
      }
      
      // Re-throw other errors
      throw bookingError;
    }
  } catch (err) {
    console.error('❌ [bookingActions] Create booking error:', err);
    
    // Handle specific error types
    if (err.type === 'SEAT_CONFLICT') {
      dispatch({
        type: BOOKING_ERROR,
        payload: err.message
      });
      throw err; // Re-throw to handle in component
    }
    
    const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat membuat booking';

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
    
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil ringkasan booking';
    
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