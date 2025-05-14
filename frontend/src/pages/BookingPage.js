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

// Import CSS untuk seat selection
import '../styles/SeatSelection.css';

const BookingPage = ({ getRouteById, route, loading }) => {
  const { id } = useParams();
  
  useEffect(() => {
    if (id) {
      getRouteById(id);
    }
  }, [getRouteById, id]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Pemesanan Tiket</h1>
            <p className="text-gray-600">Pilih kursi untuk perjalanan Anda</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center my-12">
              <Spinner />
            </div>
          ) : (
            <SeatSelection routeId={id} />
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
  loading: PropTypes.bool
};

const mapStateToProps = state => ({
  route: state.rute.selectedRoute,
  loading: state.rute.loading
});

export default connect(mapStateToProps, { getRouteById })(BookingPage);