import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import BookingSummary from '../components/booking/BookingSummary';

const BookingSummaryPage = ({ 
  auth: { isAuthenticated, loading: authLoading } 
}) => {
  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="page-container">
      <Navbar />
      
      {/* Alert with proper spacing */}
      <div className="content-with-navbar">
        <Alert />
      </div>

      <main className="main-content bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Konfirmasi Pemesanan</h1>
            <p className="text-gray-600">
              Selesaikan pemesanan Anda sebelum waktu reservasi habis
            </p>
          </div>
          
          {/* Booking Summary Component */}
          <BookingSummary />
        </div>
      </main>

      <Footer />
    </div>
  );
};

BookingSummaryPage.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(BookingSummaryPage);