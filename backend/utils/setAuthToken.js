import axios from 'axios';

const setAuthToken = token => {
  console.log('\n🔍 === SET AUTH TOKEN DEBUG ===');
  console.log('🔍 Token received:', token ? 'YES' : 'NO');
  
  if (token) {
    console.log('🔍 Token preview:', token.substring(0, 20) + '...');
    
    // Set header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('✅ Auth token set in axios defaults');
    console.log('🔍 Current axios authorization header:', axios.defaults.headers.common['Authorization']?.substring(0, 30) + '...');
    
    // Also store in localStorage
    localStorage.setItem('token', token);
    console.log('✅ Token stored in localStorage');
  } else {
    console.log('🔍 Removing authorization header...');
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Remove from localStorage
    localStorage.removeItem('token');
    
    console.log('✅ Authorization header and localStorage token removed');
  }
  
  console.log('🔍 === SET AUTH TOKEN COMPLETE ===\n');
};

export default setAuthToken;