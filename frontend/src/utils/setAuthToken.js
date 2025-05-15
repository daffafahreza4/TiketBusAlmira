import axios from 'axios';

// Fungsi untuk menambahkan token JWT ke header Authorization pada setiap request axios
const setAuthToken = token => {
  if (token) {
    // Set header untuk semua request
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Hapus header Authorization jika tidak ada token
    delete axios.defaults.headers.common['Authorization'];
  }
};

export default setAuthToken;