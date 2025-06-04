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
    console.log('🔍 [tiketActions] Fetching available seats for route:', routeId);
    
    // Set loading state
    dispatch({
      type: GET_AVAILABLE_SEATS,
      payload: null // Clear previous data
    });
    
    const res = await axios.get(`/api/tiket/available-seats/${routeId}`);
    
    console.log('✅ [tiketActions] Available seats response:', res.data);

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
      console.warn('⚠️ [tiketActions] Unexpected response structure:', res.data);
      seatData = [];
    }

    console.log('✅ [tiketActions] Processed seat data:', seatData);

    dispatch({
      type: GET_AVAILABLE_SEATS,
      payload: seatData
    });
  } catch (err) {
    console.error('❌ [tiketActions] Get available seats error:', {
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data kursi';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
  }
};

// Set selected seats - FIXED with better logging and validation
export const setSelectedSeats = seats => dispatch => {
  console.log('🔍 [tiketActions] Setting selected seats:', seats);
  
  // Validate and normalize seats data
  let normalizedSeats = [];
  
  if (Array.isArray(seats)) {
    normalizedSeats = seats.filter(seat => seat && seat.trim() !== '');
  } else if (seats && typeof seats === 'string') {
    normalizedSeats = [seats.trim()];
  }
  
  console.log('✅ [tiketActions] Normalized seats:', normalizedSeats);
  
  // Store in sessionStorage as backup
  try {
    sessionStorage.setItem('selectedSeats', JSON.stringify(normalizedSeats));
  } catch (error) {
    console.warn('⚠️ [tiketActions] Could not store seats in sessionStorage:', error);
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
    console.warn('⚠️ [tiketActions] Could not read seats from sessionStorage:', error);
    return [];
  }
};

// Clear selected seats - FIXED
export const clearSelectedSeats = () => dispatch => {
  console.log('🔍 [tiketActions] Clearing selected seats');
  
  // Clear from sessionStorage as well
  try {
    sessionStorage.removeItem('selectedSeats');
  } catch (error) {
    console.warn('⚠️ [tiketActions] Could not clear seats from sessionStorage:', error);
  }
  
  dispatch({
    type: CLEAR_SELECTED_SEATS
  });
};

// Get all tickets for user
export const getUserTickets = () => async dispatch => {
  try {
    console.log('🔍 [tiketActions] Fetching user tickets...');
    
    const res = await axios.get('/api/tiket/my-tickets');
    
    console.log('✅ [tiketActions] User tickets fetched:', res.data);

    dispatch({
      type: GET_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ [tiketActions] Get user tickets error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
  }
};

// Get ticket by id
export const getTicketById = id => async dispatch => {
  try {
    console.log('🔍 [tiketActions] Fetching ticket by ID:', id);
    
    const res = await axios.get(`/api/tiket/${id}`);
    
    console.log('✅ [tiketActions] Ticket fetched:', res.data);

    dispatch({
      type: GET_TICKET,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ [tiketActions] Get ticket by ID error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
  }
};

// Cancel ticket
export const cancelTicket = (ticketId) => async dispatch => {
  try {
    console.log('🔍 [tiketActions] Cancelling ticket:', ticketId);
    
    const res = await axios.put(`/api/tiket/cancel/${ticketId}`);
    
    console.log('✅ [tiketActions] Ticket cancelled:', res.data);

    dispatch(setAlert('Tiket berhasil dibatalkan', 'success'));

    // Refresh user tickets
    dispatch(getUserTickets());
    
    return res.data.data;
  } catch (err) {
    console.error('❌ [tiketActions] Cancel ticket error:', err.response);
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat membatalkan tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: TICKET_ERROR,
      payload: errorMsg
    });
    
    throw err;
  }
};