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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Page Header with proper spacing */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Jadwal Keberangkatan
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Pilih jadwal perjalanan yang sesuai dengan kebutuhan Anda
            </p>
          </div>
          
          {/* Route List */}
          <RouteList />
          
          {/* Login Prompt for Non-authenticated Users */}
          {!isAuthenticated && (
            <div className="mt-6 sm:mt-8 bg-blue-50 p-4 sm:p-6 rounded-lg border border-pink-200">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-bold text-pink-800 text-base sm:text-lg">
                    Belum punya akun?
                  </h3>
                  <p className="text-pink-700 text-xs sm:text-sm leading-relaxed mt-1">
                    Login atau daftar untuk menikmati kemudahan pemesanan tiket
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <a 
                  href="/login" 
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2 bg-pink-500 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors text-center text-sm sm:text-base"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2 bg-white text-pink-600 font-medium rounded-lg border border-pink-600 hover:bg-blue-50 transition-colors text-center text-sm sm:text-base"
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