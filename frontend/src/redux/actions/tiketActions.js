import axios from 'axios';
import {
  GET_TICKETS,
  GET_TICKET,
  GET_AVAILABLE_SEATS,
  SET_SELECTED_SEATS,
  CLEAR_SELECTED_SEATS,
  TICKET_ERROR
} from '../types';

// Get available seats for a route
export const getAvailableSeats = routeId => async dispatch => {
  try {
    const res = await axios.get(`/api/tiket/available-seats/${routeId}`);

    dispatch({
      type: GET_AVAILABLE_SEATS,
      payload: res.data.data
    });
  } catch (err) {
    dispatch({
      type: TICKET_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data kursi'
    });
  }
};

// Set selected seats
export const setSelectedSeats = seats => {
  return {
    type: SET_SELECTED_SEATS,
    payload: seats
  };
};

// Clear selected seats
export const clearSelectedSeats = () => {
  return {
    type: CLEAR_SELECTED_SEATS
  };
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
    dispatch({
      type: TICKET_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data tiket'
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
    dispatch({
      type: TICKET_ERROR,
      payload: err.response && err.response.data.message 
        ? err.response.data.message 
        : 'Terjadi kesalahan saat mengambil data tiket'
    });
  }
};