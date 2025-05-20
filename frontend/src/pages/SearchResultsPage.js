import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import RouteList from '../components/rute/RouteList';

const SearchResultsPage = ({ isAuthenticated }) => {
  return (
    <div className="page-container">
      <Navbar />
      
      {/* Alert with proper spacing */}
      <div className="content-with-navbar">
        <Alert />
      </div>

      <main className="main-content bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header with proper spacing */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jadwal Keberangkatan</h1>
            <p className="text-gray-600">Pilih jadwal perjalanan yang sesuai dengan kebutuhan Anda</p>
          </div>
          
          {/* Route List */}
          <RouteList />
          
          {/* Login Prompt for Non-authenticated Users */}
          {!isAuthenticated && (
            <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-white"></i>
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">Belum punya akun?</h3>
                  <p className="text-blue-700 text-sm">
                    Login atau daftar untuk menikmati kemudahan pemesanan tiket
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <a 
                  href="/login" 
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  className="px-6 py-2 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Daftar
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

SearchResultsPage.propTypes = {
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps)(SearchResultsPage);