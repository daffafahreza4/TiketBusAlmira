import axios from 'axios';
import { setAlert } from './alertActions'; // ✅ Import setAlert
import {
  GET_ADMIN_STATS,
  ADMIN_ERROR,
  CLEAR_ADMIN_DATA
} from '../types';

// Get admin dashboard stats
export const getAdminDashboardStats = () => async dispatch => {
  try {
    console.log('🔍 Fetching admin dashboard stats...'); // Debug log
    
    const res = await axios.get('/api/admin/dashboard/stats');
    
    console.log('✅ Admin stats received:', res.data); // Debug log

    dispatch({
      type: GET_ADMIN_STATS,
      payload: res.data.data
    });
  } catch (err) {
    console.error('❌ Admin stats error:', err.response); // Debug log
    
    const errorMsg = err.response && err.response.data.message 
      ? err.response.data.message 
      : 'Terjadi kesalahan saat mengambil data admin';
    
    // ✅ Tampilkan error ke user
    dispatch(setAlert(errorMsg, 'danger'));
    
    dispatch({
      type: ADMIN_ERROR,
      payload: errorMsg
    });
  }
};

// Clear admin data
export const clearAdminData = () => {
  return {
    type: CLEAR_ADMIN_DATA
  };
};