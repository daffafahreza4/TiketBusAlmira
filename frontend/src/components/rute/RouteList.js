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

  // Add refresh function for user
  const handleRefresh = () => {
    getRutes();
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 text-center">
        <div className="text-4xl mb-2">🚌</div>
        <p className="font-medium">Belum ada rute yang tersedia saat ini</p>
        <p className="text-sm">Silakan cek kembali nanti</p>
        <button 
          onClick={handleRefresh}
          className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Refresh Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add refresh button for users */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600">{routes.length} rute tersedia</p>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-sm"
        >
          <i className="fas fa-sync-alt mr-1"></i>
          Refresh
        </button>
      </div>

      {routes.map(route => (
        <div 
          key={route.id_rute} 
          className={`bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow duration-200 ${
            route.minutes_until_departure <= 10 ? 'border-l-4 border-red-500' : ''
          }`}
        >
          {/* TAMBAH: Warning untuk rute yang hampir tutup */}
          {route.minutes_until_departure <= 30 && route.minutes_until_departure > 10 && (
            <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Pemesanan akan ditutup dalam {route.minutes_until_departure} menit
            </div>
          )}
          
          {/* Warning untuk rute yang sudah sangat dekat waktu keberangkatan */}
          {route.minutes_until_departure <= 10 && route.minutes_until_departure > 0 && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Perhatian!</strong> Pemesanan akan ditutup dalam {route.minutes_until_departure} menit
            </div>
          )}

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
              {route.booking_allowed ? (
                <Link
                  to={`/booking/${route.id_rute}`}
                  className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors font-medium"
                >
                  Pesan
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-gray-400 text-white px-6 py-2 rounded-full cursor-not-allowed font-medium"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
          
          {/* Show bus info clearly */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <i className="fas fa-bus mr-2"></i>
                <span>Bus: <strong>{route.nama_bus || 'Bus Tidak Diketahui'}</strong></span>
                <span className="mx-2">•</span>
                <span>Kursi: <strong>{route.total_kursi || route.kursi_tersedia || 'N/A'}</strong></span>
              </div>
              <button className="flex items-center text-gray-500 text-sm hover:text-gray-700">
                <i className="fas fa-info-circle mr-2"></i>
                Details
              </button>
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