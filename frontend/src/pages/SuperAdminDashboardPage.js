import React, { useEffect, useState } from 'react';
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
import { getAdminDashboardStats, createVerifiedUser } from '../redux/actions/adminActions';
import { setAlert } from '../redux/actions/alertActions';

const SuperAdminDashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  admin: { stats, loading: adminLoading },
  getAdminDashboardStats,
  createVerifiedUser,
  setAlert
}) => {
  // Quick Create User Modal State
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateFormData, setQuickCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    no_telepon: '',
    role: 'user'
  });

  // Fetch admin dashboard stats when component mounts
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'super_admin') {
      getAdminDashboardStats();
    }
  }, [getAdminDashboardStats, isAuthenticated, user]);

  // Listen for global quick create user event
  useEffect(() => {
    const handleQuickCreateUser = () => {
      setShowQuickCreateModal(true);
    };

    window.addEventListener('openQuickCreateUser', handleQuickCreateUser);
    return () => window.removeEventListener('openQuickCreateUser', handleQuickCreateUser);
  }, []);

  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // Redirect if not super admin
  if (isAuthenticated && user && user.role !== 'super_admin') {
    return user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />;
  }

  // Calculate if we're loading anything
  const isLoading = authLoading || adminLoading;

  // Quick Create User Handlers
  const handleQuickCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickCreateFormData.username || !quickCreateFormData.email || !quickCreateFormData.password) {
      setAlert('Mohon isi semua field yang wajib', 'danger');
      return;
    }
    
    try {
      await createVerifiedUser(quickCreateFormData);
      setShowQuickCreateModal(false);
      setQuickCreateFormData({
        username: '',
        email: '',
        password: '',
        no_telepon: '',
        role: 'user'
      });
    } catch (error) {
      // Error handled by action
    }
  };

  const handleQuickCreateChange = (e) => {
    const { name, value } = e.target;
    setQuickCreateFormData({
      ...quickCreateFormData,
      [name]: value
    });
  };

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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <i className="fas fa-crown text-purple-600 mr-3"></i>
                    Super Admin Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Selamat datang di panel super admin, {user?.username || 'Super Admin'}!
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickCreateModal(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Quick Create User
                </button>
              </div>
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

                  {/* Super Admin Quick Actions Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <i className="fas fa-crown text-purple-600 mr-2"></i>
                      Super Admin Actions
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowQuickCreateModal(true)}
                        className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-user-plus mr-3 text-purple-600"></i>
                        Buat User Terverifikasi
                      </button>

                      <Link to="/admin/buses" className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <i className="fas fa-bus mr-3 text-blue-600"></i>
                        Kelola Bus
                      </Link>

                      <Link to="/admin/routes" className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <i className="fas fa-route mr-3 text-green-600"></i>
                        Kelola Rute
                      </Link>

                      <Link to="/admin/users" className="block w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                        <i className="fas fa-users mr-3 text-red-600"></i>
                        Kelola Users
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

      {/* Quick Create User Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Quick Create User
              </h3>
              <button
                onClick={() => setShowQuickCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit}>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={quickCreateFormData.username}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Masukkan username"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={quickCreateFormData.email}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={quickCreateFormData.password}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon (Opsional)
                  </label>
                  <input
                    type="text"
                    name="no_telepon"
                    value={quickCreateFormData.no_telepon}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={quickCreateFormData.role}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="user">User - Pengguna biasa</option>
                    <option value="admin">Admin - Administrator sistem</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <i className="fas fa-crown mr-2"></i>
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer positioned properly */}
      <div className="ml-0 md:ml-64">
        <Footer />
      </div>
    </div>
  );
};

SuperAdminDashboardPage.propTypes = {
  auth: PropTypes.object.isRequired,
  admin: PropTypes.object.isRequired,
  getAdminDashboardStats: PropTypes.func.isRequired,
  createVerifiedUser: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin: state.admin
});

export default connect(mapStateToProps, { 
  getAdminDashboardStats, 
  createVerifiedUser,
  setAlert 
})(SuperAdminDashboardPage);