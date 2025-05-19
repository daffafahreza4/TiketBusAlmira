import axios from 'axios';

const setAuthToken = token => {
  if (token) {
    // Set header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Also store in localStorage
    localStorage.setItem('token', token);
  } else {
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Remove from localStorage
    localStorage.removeItem('token');
  }
};

export default setAuthToken;