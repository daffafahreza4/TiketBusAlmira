import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import { getRutes } from '../../redux/actions/ruteActions';
import { formatCurrency, formatTime } from '../../utils/formatters';

const RouteList = ({ routes, loading, error, getRutes }) => {
  // Fetch all routes when component mounts
  useEffect(() => {
    getRutes();
  }, [getRutes]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        {error}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 text-center">
        <div className="text-4xl mb-2">🚌</div>
        <p className="font-medium">Belum ada rute yang tersedia saat ini</p>
        <p className="text-sm">Silakan cek kembali nanti</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routes.map(route => (
        <div 
          key={route.id_rute} 
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex justify-between items-center">
            {/* Left side - Time and Route info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                {/* Departure Time */}
                <div className="text-xl font-bold text-gray-900">
                  {formatTime(route.waktu_berangkat)}
                </div>
                
                {/* Route Line */}
                <div className="flex-1 border-t-2 border-blue-300 relative">
                  <div className="absolute left-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
                </div>
                
                {/* Arrival Time */}
                <div className="text-xl font-bold text-gray-900">
                  {formatTime(route.perkiraan_tiba)}
                </div>
              </div>
              
              {/* Station Names */}
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>{route.asal}</span>
                <span>{route.tujuan}</span>
              </div>
              
              {/* Details Section */}
              <div className="flex items-center space-x-4">
                <button className="flex items-center text-gray-500 text-sm hover:text-gray-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  Details
                </button>
                
                {/* Price */}
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(route.harga)}
                </div>
              </div>
            </div>
            
            {/* Right side - Book button */}
            <div className="ml-6">
              <Link
                to={`/booking/${route.id_rute}`}
                className="bg-gray-800 text-white px-6 py-2 rounded-full hover:bg-gray-900 transition-colors duration-200 font-medium"
              >
                Pesan
              </Link>
            </div>
          </div>
          
          {/* Bus info and facilities */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{route.nama_bus}</span>
                {route.fasilitas && (
                  <div className="flex space-x-2">
                    {route.fasilitas.split(',').map((facility, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {facility.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-green-600">
                <i className="fas fa-chair mr-1"></i>
                {route.kursi_tersedia || route.total_kursi} kursi tersedia
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

RouteList.propTypes = {
  routes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  getRutes: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  routes: state.rute.routes,
  loading: state.rute.loading,
  error: state.rute.error
});

export default connect(mapStateToProps, { getRutes })(RouteList);