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
          className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex justify-between items-center">
            {/* Waktu & Rute */}
            <div className="flex items-center space-x-8">
              {/* Departure */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(route.waktu_berangkat)}
                </div>
                <div className="text-sm text-gray-500">
                  {route.asal}
                </div>
              </div>
              
              {/* Route Line */}
              <div className="flex-1 relative px-8">
                <div className="border-t-2 border-gray-300 relative">
                  <div className="absolute left-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-0 top-0 w-3 h-3 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
                </div>
              </div>
              
              {/* Arrival */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(route.perkiraan_tiba)}
                </div>
                <div className="text-sm text-gray-500">
                  {route.tujuan}
                </div>
              </div>
            </div>
            
            {/* Harga & Tombol */}
            <div className="text-right ml-6">
              <div className="text-xl font-bold text-gray-900 mb-2">
                {formatCurrency(route.harga)}
              </div>
              <Link
                to={`/booking/${route.id_rute}`}
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium"
              >
                Pesan
              </Link>
            </div>
          </div>
          
          {/* Details */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button className="flex items-center text-gray-500 text-sm hover:text-gray-700">
              <i className="fas fa-info-circle mr-2"></i>
              Details
            </button>
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