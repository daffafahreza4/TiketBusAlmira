import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import RouteList from '../components/rute/RouteList';
import SearchRoute from '../components/rute/SearchRoute';

const SearchResultsPage = ({ isAuthenticated }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />

      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <SearchRoute />
          </div>
          
          <RouteList />
          
          {!isAuthenticated && (
            <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">Belum login?</h3>
              <p className="text-blue-700 mb-2">
                Login atau daftar untuk menikmati kemudahan pemesanan tiket dan layanan lainnya.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="/login" 
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                >
                  Login
                </a>
                <a 
                  href="/register" 
                  className="px-4 py-2 bg-white text-blue-600 font-bold rounded border border-blue-600 hover:bg-blue-50"
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