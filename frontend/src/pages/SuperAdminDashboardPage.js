import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';

// Admin Dashboard Widgets (reuse existing widgets)
import AdminStatsWidget from '../components/admin/AdminStatsWidget';
import RecentTicketsAdminWidget from '../components/admin/RecentTicketsAdminWidget';
import UserStatsWidget from '../components/admin/UserStatsWidget';

// Actions
import { 
  getAdminDashboardStats, 
  getAllUsers, 
  createVerifiedUser 
} from '../redux/actions/adminActions';
import { setAlert } from '../redux/actions/alertActions';

const SuperAdminDashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  admin: { stats, users, loading: adminLoading },
  getAdminDashboardStats,
  getAllUsers,
  createVerifiedUser,
  setAlert
}) => {
  // State untuk Quick Create User Modal
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    username: '',
    email: '',
    password: '',
    no_telepon: '',
    role: 'user'
  });
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);

  // Fetch dashboard data when component mounts
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'super_admin') {
      getAdminDashboardStats();
      getAllUsers();
    }
  }, [getAdminDashboardStats, getAllUsers, isAuthenticated, user]);

  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // Redirect if not super admin
  if (isAuthenticated && user && user.role !== 'super_admin') {
    // Redirect regular admin to admin dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/dashboard" />;
  }

  // Calculate if we're loading anything
  const isLoading = authLoading || adminLoading;

  // Handler untuk Quick Create User
  const handleQuickCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickCreateData.username || !quickCreateData.email || !quickCreateData.password) {
      setAlert('Username, email, dan password harus diisi', 'danger');
      return;
    }

    if (quickCreateData.password.length < 6) {
      setAlert('Password minimal 6 karakter', 'danger');
      return;
    }

    try {
      setQuickCreateLoading(true);
      await createVerifiedUser(quickCreateData);
      
      // Reset form dan tutup modal
      setQuickCreateData({
        username: '',
        email: '',
        password: '',
        no_telepon: '',
        role: 'user'
      });
      setShowQuickCreateModal(false);
      
      // Refresh stats dan user list
      getAdminDashboardStats();
      getAllUsers();
      
    } catch (error) {
      // Error handled by action
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const handleQuickCreateChange = (e) => {
    setQuickCreateData({
      ...quickCreateData,
      [e.target.name]: e.target.value
    });
  };

  // Statistik tambahan untuk super admin
  const usersByRole = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {}) || {};

  const adminUsers = users?.filter(u => u.role === 'admin') || [];
  const recentUsers = users?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <AdminSidebar />

        {/* Main content area */}
        <main className="flex-1 ml-0 md:ml-64 pt-16 pb-0">
          <div className="p-6 min-h-full">
            <Alert />

            {/* Page Header - Super Admin Style */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center">
                      <i className="fas fa-crown mr-3"></i>
                      Super Admin Dashboard
                    </h1>
                    <p className="mt-2 opacity-90">
                      Selamat datang, {user?.username}! Kelola seluruh sistem Bus Almira Travel.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-75">Total Pengguna</div>
                    <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {/* Row 1: Stats Overview - Enhanced with User Role Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <AdminStatsWidget
                    stats={stats || {}}
                    loading={isLoading}
                  />
                  
                  {/* User Role Breakdown Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Users by Role</h3>
                      <i className="fas fa-users-cog text-purple-500 text-xl"></i>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Super Admin:</span>
                        <span className="font-semibold text-purple-600">{usersByRole['super_admin'] || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Admin:</span>
                        <span className="font-semibold text-blue-600">{usersByRole['admin'] || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">User:</span>
                        <span className="font-semibold text-green-600">{usersByRole['user'] || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Charts and Super Admin Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserStatsWidget
                    stats={stats || {}}
                    loading={isLoading}
                  />

                  {/* Super Admin Quick Actions Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">
                      <i className="fas fa-crown mr-2 text-purple-500"></i>
                      Super Admin Actions
                    </h3>
                    <div className="space-y-3">
                      {/* Quick Create User - Fitur Utama */}
                      <button
                        onClick={() => setShowQuickCreateModal(true)}
                        className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-user-plus mr-3 text-purple-600"></i>
                        <span className="font-medium">Buat User Baru (Bypass OTP)</span>
                        <div className="text-xs text-gray-500 mt-1">Langsung aktif tanpa verifikasi email</div>
                      </button>

                      <Link to="/admin/users" className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                        <i className="fas fa-users mr-3 text-blue-600"></i>
                        <span className="font-medium">Kelola Semua Users</span>
                        <div className="text-xs text-gray-500 mt-1">{stats?.totalUsers || 0} total users</div>
                      </Link>

                      <Link to="/admin/buses" className="block w-full text-left p-3 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                        <i className="fas fa-bus mr-3 text-pink-600"></i>
                        <span className="font-medium">Kelola Bus & Rute</span>
                        <div className="text-xs text-gray-500 mt-1">{stats?.totalBuses || 0} bus, {stats?.totalActiveRoutes || 0} rute aktif</div>
                      </Link>

                      <Link to="/admin/routes" className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                        <i className="fas fa-route mr-3 text-green-600"></i>
                        <span className="font-medium">Tambah Rute Baru</span>
                        <div className="text-xs text-gray-500 mt-1">Sistem 1 bus = 1 rute aktif</div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Row 3: Recent Activities & Admin Management */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Users Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">Pengguna Terbaru</h3>
                      <Link to="/admin/users" className="text-purple-500 hover:text-purple-700 text-sm">
                        Lihat Semua
                      </Link>
                    </div>
                    
                    {recentUsers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <i className="fas fa-users text-2xl mb-2"></i>
                        <p>Belum ada pengguna terbaru</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentUsers.map((user) => (
                          <div key={user.id_user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm mr-3 ${
                                user.role === 'super_admin' ? 'bg-purple-500' :
                                user.role === 'admin' ? 'bg-blue-500' : 'bg-green-500'
                              }`}>
                                {user.role === 'super_admin' ? (
                                  <i className="fas fa-crown"></i>
                                ) : user.role === 'admin' ? (
                                  <i className="fas fa-user-shield"></i>
                                ) : (
                                  user.username.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{user.username}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Admin Users Management */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">
                        <i className="fas fa-user-shield mr-2 text-blue-500"></i>
                        Administrator ({adminUsers.length})
                      </h3>
                      <Link to="/admin/users?role=admin" className="text-purple-500 hover:text-purple-700 text-sm">
                        Kelola Admin
                      </Link>
                    </div>
                    
                    {adminUsers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <i className="fas fa-user-shield text-2xl mb-2"></i>
                        <p>Belum ada administrator</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {adminUsers.slice(0, 4).map((admin) => (
                          <div key={admin.id_user} className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                              <i className="fas fa-user-shield text-sm"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{admin.username}</div>
                              <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                            </div>
                          </div>
                        ))}
                        {adminUsers.length > 4 && (
                          <div className="text-center text-sm text-gray-500">
                            +{adminUsers.length - 4} admin lainnya
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 4: Recent Tickets (reuse existing widget) */}
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

      {/* Quick Create User Modal */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                <i className="fas fa-crown mr-2 text-purple-500"></i>
                Quick Create User
              </h3>
              <button
                onClick={() => setShowQuickCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={quickCreateLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center text-purple-700">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="text-sm font-medium">Bypass OTP - User langsung aktif</span>
              </div>
            </div>

            <form onSubmit={handleQuickCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={quickCreateData.username}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={quickCreateLoading}
                    placeholder="Masukkan username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={quickCreateData.email}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={quickCreateLoading}
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={quickCreateData.password}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={quickCreateLoading}
                    minLength="6"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    name="no_telepon"
                    value={quickCreateData.no_telepon}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={quickCreateLoading}
                    placeholder="08xxxxxxxxxx (opsional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={quickCreateData.role}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    disabled={quickCreateLoading}
                  >
                    <option value="user">User - Pengguna biasa</option>
                    <option value="admin">Admin - Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={quickCreateLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center"
                  disabled={quickCreateLoading}
                >
                  {quickCreateLoading ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-crown mr-2"></i>
                  )}
                  {quickCreateLoading ? 'Membuat...' : 'Buat User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

SuperAdminDashboardPage.propTypes = {
  auth: PropTypes.object.isRequired,
  admin: PropTypes.object.isRequired,
  getAdminDashboardStats: PropTypes.func.isRequired,
  getAllUsers: PropTypes.func.isRequired,
  createVerifiedUser: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin: state.admin
});

export default connect(mapStateToProps, { 
  getAdminDashboardStats, 
  getAllUsers, 
  createVerifiedUser, 
  setAlert 
})(SuperAdminDashboardPage);