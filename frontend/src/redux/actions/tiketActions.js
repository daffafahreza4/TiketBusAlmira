import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_TICKETS,
  GET_TICKET,
  GET_AVAILABLE_SEATS,
  SET_SELECTED_SEATS,
  CLEAR_SELECTED_SEATS,
  TICKET_ERROR
} from '../types';

// Get available seats for a route - FIXED
export const getAvailableSeats = routeId => async dispatch => {
  try {
    // Set loading state
    dispatch({
      type: GET_AVAILABLE_SEATS,
      payload: null // Clear previous data
    });

    const res = await axios.get(`/api/tiket/available-seats/${routeId}`);

    // TAMBAH: Handle booking closed response
    if (res.data.booking_closed) {
      throw new Error(res.data.message || 'Pemesanan sudah ditutup');
    }

    // Handle different response structures from backend
    let seatData = null;

    if (res.data.success && res.data.data) {
      seatData = res.data.data;
    } else if (res.data.data) {
      seatData = res.data.data;
    } else if (Array.isArray(res.data)) {
      // Direct array response
      seatData = res.data;
    } else {
      seatData = [];
    }

    dispatch({
      type: GET_AVAILABLE_SEATS,
      payload: seatData
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengambil data kursi';

    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
    
    // TAMBAH: Throw error untuk handling di component
    throw err;
  }
};

// Tambahkan action untuk check seat availability
export const checkSeatAvailability = (routeId, seats) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const body = JSON.stringify({ seats });

    const res = await axios.post(`/api/tiket/check-seat-availability/${routeId}`, body, config);

    return res.data.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengecek ketersediaan kursi';

    dispatch(setAlert(errorMsg, 'danger'));
    throw err;
  }
};

// Set selected seats - FIXED with better logging and validation
export const setSelectedSeats = seats => dispatch => {
  // Validate and normalize seats data
  let normalizedSeats = [];

  if (Array.isArray(seats)) {
    normalizedSeats = seats.filter(seat => seat && seat.trim() !== '');
  } else if (seats && typeof seats === 'string') {
    normalizedSeats = [seats.trim()];
  }

  // Store in sessionStorage as backup
  try {
    sessionStorage.setItem('selectedSeats', JSON.stringify(normalizedSeats));
  } catch (error) {
    // Silently handle sessionStorage errors
  }

  dispatch({
    type: SET_SELECTED_SEATS,
    payload: normalizedSeats
  });
};

// Get selected seats from storage as backup
export const getSelectedSeatsFromStorage = () => {
  try {
    const storedSeats = sessionStorage.getItem('selectedSeats');
    return storedSeats ? JSON.parse(storedSeats) : [];
  } catch (error) {
    return [];
  }
};

// Clear selected seats - FIXED
export const clearSelectedSeats = () => dispatch => {
  // Clear from sessionStorage as well
  try {
    sessionStorage.removeItem('selectedSeats');
  } catch (error) {
    // Silently handle sessionStorage errors
  }

  dispatch({
    type: CLEAR_SELECTED_SEATS
  });
};

// Get all tickets for user
export const getUserTickets = () => async dispatch => {
  try {
    const res = await axios.get('/api/tiket/my-tickets');

    dispatch({
      type: GET_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';

    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
  }
};

// Get ticket by id
export const getTicketById = id => async dispatch => {
  try {
    const res = await axios.get(`/api/tiket/${id}`);

    dispatch({
      type: GET_TICKET,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';

    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
  }
};

// Tambahkan action baru untuk grouped tickets
export const getGroupedTicketById = id => async dispatch => {
  try {
    const res = await axios.get(`/api/tiket/grouped/${id}`);

    dispatch({
      type: GET_TICKET,
      payload: res.data.data
    });
  } catch (err) {
    // Fallback to regular ticket if grouped fails
    try {
      const res = await axios.get(`/api/tiket/${id}`);
      dispatch({
        type: GET_TICKET,
        payload: res.data.data
      });
    } catch (fallbackErr) {
      const errorMsg = fallbackErr.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';

      dispatch({
        type: TICKET_ERROR,
        payload: errorMsg
      });
    }
  }
};

// Cancel ticket
export const cancelTicket = (ticketId) => async dispatch => {
  try {
    const res = await axios.put(`/api/tiket/cancel/${ticketId}`);

    dispatch(setAlert('Tiket berhasil dibatalkan', 'success'));

    // Update selected ticket jika sedang dilihat
    dispatch({
      type: GET_TICKET,
      payload: {
        ...res.data.data,
        status_tiket: 'cancelled'
      }
    });

    // Refresh user tickets
    dispatch(getUserTickets());

    return res.data.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat membatalkan tiket';

    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });

    throw err;
  }
};