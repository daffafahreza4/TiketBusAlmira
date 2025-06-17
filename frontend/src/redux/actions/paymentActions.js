import axios from 'axios';
import { setAlert } from './alertActions';

// Create payment token
export const createPaymentToken = (id_tiket) => async dispatch => {
  try {
    const config = { headers: { 'Content-Type': 'application/json' } };
    
    const res = await axios.post('/api/pembayaran/create', { id_tiket }, config);
    
    if (res.data.success) {
      const { snap_token, redirect_url } = res.data.data;
      
      dispatch(setAlert('Token pembayaran berhasil dibuat', 'success'));
      
      return {
        success: true,
        snap_token,
        redirect_url,
        data: res.data.data
      };
    }
    
    throw new Error(res.data.message || 'Gagal membuat token pembayaran');
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat membuat token pembayaran';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    throw {
      success: false,
      message: errorMsg
    };
  }
};

// Check payment status
export const checkPaymentStatus = (id_tiket) => async dispatch => {
  try {
    const res = await axios.get(`/api/pembayaran/status/${id_tiket}`);
    
    return {
      success: true,
      data: res.data.data
    };
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengecek status pembayaran';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    throw {
      success: false,
      message: errorMsg
    };
  }
};

// Cancel payment
export const cancelPayment = (id_tiket) => async dispatch => {
  try {
    const res = await axios.put(`/api/pembayaran/cancel/${id_tiket}`);
    
    if (res.data.success) {
      dispatch(setAlert('Pembayaran berhasil dibatalkan', 'success'));
      
      return {
        success: true,
        data: res.data.data
      };
    }
    
    throw new Error(res.data.message || 'Gagal membatalkan pembayaran');
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat membatalkan pembayaran';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    throw {
      success: false,
      message: errorMsg
    };
  }
};

// Get payment methods
export const getPaymentMethods = () => async dispatch => {
  try {
    const res = await axios.get('/api/pembayaran/methods');
    
    return {
      success: true,
      data: res.data.data
    };
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Terjadi kesalahan saat mengambil metode pembayaran';
    
    dispatch(setAlert(errorMsg, 'danger'));
    
    throw {
      success: false,
      message: errorMsg
    };
  }
};