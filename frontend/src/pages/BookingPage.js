import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import SeatSelection from '../components/tiket/SeatSelection';
import { getRouteById } from '../redux/actions/ruteActions';
import '../styles/SeatSelection.css';

// Import CSS untuk seat selection
import '../styles/SeatSelection.css';

const BookingPage = ({ getRouteById, route, loading, error }) => {
  const { id } = useParams();
  
  useEffect(() => {
    if (id) {
      getRouteById(id);
    }
  }, [getRouteById, id]);

  if (error) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-with-navbar">
          <Alert />
        </div>
        
        <main className="main-content bg-gray-100">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2">Error</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <Navbar />
      
      <div className="content-with-navbar">
        <Alert />
      </div>
      
      <main className="main-content bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Pemesanan Tiket</h1>
            <p className="text-gray-600">Pilih kursi untuk perjalanan Anda</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center my-12">
              <Spinner />
            </div>
          ) : route ? (
            <SeatSelection routeId={id} />
          ) : (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Rute Tidak Ditemukan</h3>
              <p>Rute yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Kembali ke Pencarian
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

BookingPage.propTypes = {
  getRouteById: PropTypes.func.isRequired,
  route: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  route: state.rute.selectedRoute,
  loading: state.rute.loading,
  error: state.rute.error
});

export default connect(mapStateToProps, { getRouteById })(BookingPage);