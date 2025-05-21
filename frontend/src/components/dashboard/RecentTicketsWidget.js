import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// Ubah definisi komponen untuk menggunakan parameter default
const RecentTicketsWidget = ({ tickets = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Riwayat Tiket</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Riwayat Tiket</h3>
        <Link to="/my-tickets" className="text-sm text-blue-600 hover:underline">
          Lihat Semua
        </Link>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-md text-center">
        <div className="text-4xl text-gray-300 mb-2">
          <i className="fas fa-history"></i>
        </div>
        <p className="text-gray-600">Tidak ada riwayat tiket</p>
      </div>
    </div>
  );
};

RecentTicketsWidget.propTypes = {
  tickets: PropTypes.array,
  loading: PropTypes.bool
};

// Hapus defaultProps
// RecentTicketsWidget.defaultProps = {
//   tickets: [],
//   loading: false
// };

export default RecentTicketsWidget;