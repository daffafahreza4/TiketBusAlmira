import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
import setAuthToken from './utils/setAuthToken';

// Set default base URL for axios
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Check if there's a token in localStorage on app start
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);