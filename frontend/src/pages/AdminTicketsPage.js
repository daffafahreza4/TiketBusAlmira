import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import AdminTicketList from '../components/admin/AdminTicketList';

const AdminTicketsPage = ({ auth: { user, isAuthenticated, loading: authLoading } }) => {
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  if (isAuthenticated && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        {/* Main content area */}
        <main className="flex-1 ml-0 md:ml-64 pt-16 pb-0">
          <div className="p-6 min-h-full">
            <Alert />
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Kelola Tiket</h1>
              <p className="mt-1 text-sm text-gray-600">
                Kelola semua tiket yang telah dipesan oleh pengguna
              </p>
            </div>
            
            {/* Ticket List Component */}
            <div className="pb-8">
              <AdminTicketList />
            </div>
          </div>
        </main>
      </div>
      
      <div className="ml-0 md:ml-64">
        <Footer />
      </div>
    </div>
  );
};

AdminTicketsPage.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(AdminTicketsPage);