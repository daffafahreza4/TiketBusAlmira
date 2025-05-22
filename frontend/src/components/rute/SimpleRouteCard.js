import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatTime } from '../../utils/formatters';

const SimpleRouteCard = ({ route }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-center">
        {/* Waktu & Rute */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(route.waktu_berangkat)}</div>
            <div className="text-sm text-gray-500">{route.asal}</div>
          </div>
          
          <div className="flex-1 relative px-8">
            <div className="border-t-2 border-gray-300 relative">
              <div className="absolute left-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(route.perkiraan_tiba)}</div>
            <div className="text-sm text-gray-500">{route.tujuan}</div>
          </div>
        </div>
        
        {/* Harga & Tombol */}
        <div className="text-right ml-6">
          <div className="text-xl font-bold mb-2">{formatCurrency(route.harga)}</div>
          <Link
            to={`/booking/${route.id_rute}`}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium"
          >
            Pesan
          </Link>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="flex items-center text-gray-500 text-sm hover:text-gray-700">
          <i className="fas fa-info-circle mr-2"></i>Details
        </button>
      </div>
    </div>
  );
};

export default SimpleRouteCard;