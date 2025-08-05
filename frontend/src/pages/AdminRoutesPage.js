import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import AdminRouteList from '../components/admin/AdminRouteList';

const AdminRoutesPage = ({
  auth: { user, isAuthenticated, loading: authLoading }
}) => {
  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // ✅ FIXED: Allow both admin and super_admin to access
  if (isAuthenticated && user && !['admin', 'super_admin'].includes(user.role)) {
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
              <h1 className="text-3xl font-bold text-gray-900">Kelola Rute</h1>
              <p className="mt-1 text-sm text-gray-600">
                Kelola semua rute perjalanan bus dalam sistem
              </p>
              {/* ✅ ADDED: Show user's current role for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-1 text-xs text-blue-600">
                  Current role: {user?.role} | Access level: {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              )}
            </div>
            
            {/* Route List Component */}
            <div className="pb-8">
              <AdminRouteList />
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer positioned properly */}
      <div className="ml-0 md:ml-64">
        <Footer />
      </div>
    </div>
  );
};

AdminRoutesPage.propTypes = {
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(AdminRoutesPage);