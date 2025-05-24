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
    console.log('🔍 [ticketAdminActions] Fetching all admin tickets...');
    
    dispatch({
      type: CLEAR_TICKET_ADMIN
    });
    
    const res = await axios.get('/api/admin/tickets');
    
    console.log('✅ [ticketAdminActions] Admin tickets received:', {
      count: res.data.count,
      dataLength: res.data.data?.length
    });

    dispatch({
      type: GET_ADMIN_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ [ticketAdminActions] Get admin tickets error:', {
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data tiket';
    
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
    console.log('🔍 [ticketAdminActions] Fetching admin ticket by ID:', ticketId);
    
    const res = await axios.get(`/api/admin/tickets/${ticketId}`);
    
    console.log('✅ [ticketAdminActions] Admin ticket received:', res.data.data);

    dispatch({
      type: GET_ADMIN_TICKET,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ [ticketAdminActions] Get admin ticket by ID error:', {
      ticketId,
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data tiket';
    
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
    console.log('🔍 [ticketAdminActions] Updating ticket status:', {
      ticketId,
      statusData
    });
    
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const res = await axios.put(`/api/admin/tickets/${ticketId}/status`, statusData, config);
    
    console.log('✅ [ticketAdminActions] Ticket status updated:', res.data.data);
    
    dispatch({
      type: UPDATE_TICKET_STATUS_SUCCESS,
      payload: res.data.data
    });
    
    dispatch(setAlert('Status tiket berhasil diperbarui', 'success'));
    
    // Refresh ticket list
    dispatch(getAllAdminTickets());
  } catch (err) {
    console.error('❌ [ticketAdminActions] Update ticket status error:', {
      ticketId,
      statusData,
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat memperbarui status tiket';
    
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
    console.log('🔍 [ticketAdminActions] Deleting admin ticket:', ticketId);
    
    await axios.delete(`/api/admin/tickets/${ticketId}`);
    
    console.log('✅ [ticketAdminActions] Ticket deleted:', ticketId);
    
    dispatch({
      type: DELETE_ADMIN_TICKET_SUCCESS,
      payload: ticketId
    });
    
    dispatch(setAlert('Tiket berhasil dihapus', 'success'));
    
    // Refresh ticket list
    dispatch(getAllAdminTickets());
  } catch (err) {
    console.error('❌ [ticketAdminActions] Delete admin ticket error:', {
      ticketId,
      status: err.response?.status,
      message: err.response?.data?.message,
      error: err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat menghapus tiket';
    
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
    console.log('🔍 [ticketAdminActions] Fetching tickets by status:', status);
    
    const res = await axios.get(`/api/admin/tickets?status=${status}`);
    
    console.log('✅ [ticketAdminActions] Tickets by status received:', {
      status,
      count: res.data.count
    });

    dispatch({
      type: GET_ADMIN_TICKETS,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ [ticketAdminActions] Get tickets by status error:', {
      status,
      error: err.response?.data?.message || err.message
    });
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data tiket';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: TICKET_ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Clear ticket admin data
export const clearTicketAdminData = () => {
  console.log('🔍 [ticketAdminActions] Clearing ticket admin data');
  
  return {
    type: CLEAR_TICKET_ADMIN
  };
};