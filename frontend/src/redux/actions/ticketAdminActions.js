import axios from 'axios';
import { setAlert } from './alertActions';
import {
  GET_ADMIN_TICKETS,
  GET_ADMIN_TICKET,
  UPDATE_TICKET_STATUS_SUCCESS,
  DELETE_ADMIN_TICKET_SUCCESS,
  TICKET_ADMIN_ERROR,
  CLEAR_TICKET_ADMIN
} from '../types';

// Get all tickets for admin
export const getAllAdminTickets = () => async dispatch => {
  try {
    dispatch({ type: CLEAR_TICKET_ADMIN });
    
    const res = await axios.get('/api/admin/tickets');

    dispatch({
      type: GET_ADMIN_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Get ticket by ID for admin
export const getAdminTicketById = (ticketId) => async dispatch => {
  try {
    const res = await axios.get(`/api/admin/tickets/${ticketId}`);

    dispatch({
      type: GET_ADMIN_TICKET,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Update ticket status
export const updateTicketStatus = (ticketId, statusData) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    const res = await axios.put(`/api/admin/tickets/${ticketId}/status`, statusData, config);
    
    dispatch({
      type: UPDATE_TICKET_STATUS_SUCCESS,
      payload: res.data.data
    });
    
    dispatch(setAlert('Status tiket berhasil diperbarui', 'success'));
    
    // Refresh ticket list
    dispatch(getAllAdminTickets());
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat memperbarui status tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Delete ticket (admin only)
export const deleteAdminTicket = (ticketId) => async dispatch => {
  try {
    await axios.delete(`/api/admin/tickets/${ticketId}`);
    
    dispatch({
      type: DELETE_ADMIN_TICKET_SUCCESS,
      payload: ticketId
    });
    
    dispatch(setAlert('Tiket berhasil dihapus', 'success'));
    
    // Refresh ticket list
    dispatch(getAllAdminTickets());
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat menghapus tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Get tickets by status (for filtering)
export const getTicketsByStatus = (status) => async dispatch => {
  try {
    const res = await axios.get(`/api/admin/tickets?status=${status}`);

    dispatch({
      type: GET_ADMIN_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Clear ticket admin data
export const clearTicketAdminData = () => ({ type: CLEAR_TICKET_ADMIN });