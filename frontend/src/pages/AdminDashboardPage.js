import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { Link } from 'react-router-dom';

// Admin Dashboard Widgets
import AdminStatsWidget from '../components/admin/AdminStatsWidget';
import RecentTicketsAdminWidget from '../components/admin/RecentTicketsAdminWidget';
import UserStatsWidget from '../components/admin/UserStatsWidget';

// Actions
import { getAdminDashboardStats } from '../redux/actions/adminActions';

const AdminDashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  admin: { stats, loading: adminLoading },
  getAdminDashboardStats
}) => {
  // Fetch admin dashboard stats when component mounts
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'admin') {
      getAdminDashboardStats();
    }
  }, [getAdminDashboardStats, isAuthenticated, user]);

  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // Redirect if not admin
  if (isAuthenticated && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Calculate if we're loading anything
  const isLoading = authLoading || adminLoading;

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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Selamat datang di panel admin, {user?.username || 'Admin'}!
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {/* Row 1: Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AdminStatsWidget
                    stats={stats || {}}
                    loading={isLoading}
                  />
                </div>

                {/* Row 2: Charts and Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserStatsWidget
                    stats={stats || {}}
                    loading={isLoading}
                  />

                  {/* Quick Actions Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-3">

                      <Link to="/admin/buses" className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <i className="fas fa-plus mr-3 text-blue-600"></i>
                        Tambah Bus Baru
                      </Link>

                      <Link to="/admin/routes" className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <i className="fas fa-route mr-3 text-green-600"></i>
                        Tambah Rute Baru
                      </Link>

                      <Link to="/admin/users" className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                        <i className="fas fa-chart-bar mr-3 text-purple-600"></i>
                        Users
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Row 3: Recent Activities */}
                <div>
                  <RecentTicketsAdminWidget
                    recentTickets={stats?.recentTickets || []}
                    loading={isLoading}
                  />
                </div>
              </div>
            )}
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

AdminDashboardPage.propTypes = {
  auth: PropTypes.object.isRequired,
  admin: PropTypes.object.isRequired,
  getAdminDashboardStats: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin: state.admin
});

export default connect(mapStateToProps, { getAdminDashboardStats })(AdminDashboardPage);