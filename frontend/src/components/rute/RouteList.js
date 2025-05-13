import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const RouteList = ({ routes, loading, error, searchParams }) => {
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
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4">
        Tidak ada rute yang tersedia untuk pencarian Anda. Silakan coba tanggal atau tujuan lain.
      </div>
    );
  }

  return (
    <div>
      {searchParams && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="font-bold text-lg mb-2">Hasil Pencarian</h3>
          <div className="flex flex-wrap gap-x-8">
            <div>
              <span className="text-gray-600">Dari:</span> {searchParams.asal}
            </div>
            <div>
              <span className="text-gray-600">Ke:</span> {searchParams.tujuan}
            </div>
            <div>
              <span className="text-gray-600">Tanggal:</span> {formatDate(searchParams.tanggal)}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {routes.map(route => (
          <div 
            key={route.id_rute} 
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
              <div>
                <h3 className="font-bold text-lg">{route.nama_bus}</h3>
                <p className="text-gray-600">{route.kelas || 'Ekonomi'}</p>
              </div>
              <div className="font-bold text-xl text-blue-600">
                {formatCurrency(route.harga)}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between border-t border-b py-3 my-3">
              <div className="flex items-center mb-2 md:mb-0">
                <div className="mr-2 text-lg font-semibold">{formatTime(route.waktu_berangkat)}</div>
                <div className="text-gray-600">{route.asal}</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-gray-500">
                  <i className="fas fa-arrow-right"></i>
                </div>
                <div className="text-xs text-gray-500">8 jam (perkiraan)</div>
              </div>
              
              <div className="flex items-center mt-2 md:mt-0">
                <div className="mr-2 text-lg font-semibold">{formatTime(route.perkiraan_tiba)}</div>
                <div className="text-gray-600">{route.tujuan}</div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-3 md:mb-0">
                <p className="text-sm text-gray-600">
                  <i className="fas fa-chair mr-1"></i>
                  {route.kursi_tersedia} kursi tersedia
                </p>
                {route.fasilitas && (
                  <div className="flex mt-1 space-x-2">
                    {route.fasilitas.includes('AC') && <span className="text-xs bg-gray-200 px-2 py-1 rounded">AC</span>}
                    {route.fasilitas.includes('WiFi') && <span className="text-xs bg-gray-200 px-2 py-1 rounded">WiFi</span>}
                    {route.fasilitas.includes('USB Charging') && <span className="text-xs bg-gray-200 px-2 py-1 rounded">USB</span>}
                    {route.fasilitas.includes('Toilet') && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Toilet</span>}
                  </div>
                )}
              </div>
              
              <Link
                to={`/booking/${route.id_rute}`}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300"
              >
                Pilih
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

RouteList.propTypes = {
  routes: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  searchParams: PropTypes.object
};

const mapStateToProps = state => ({
  routes: state.rute.routes,
  loading: state.rute.loading,
  error: state.rute.error,
  searchParams: state.rute.searchParams
});

export default connect(mapStateToProps)(RouteList);