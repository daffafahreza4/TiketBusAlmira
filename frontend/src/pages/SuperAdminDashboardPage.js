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
  
  // Validation State
  const [quickCreateValidation, setQuickCreateValidation] = useState({
    username: { isValid: true, message: '' },
    email: { isValid: true, message: '' },
    password: { isValid: true, message: '' }
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

  // Validation Functions
  const validateUsername = (username) => {
    if (!username || username.trim().length < 3) {
      return { isValid: false, message: 'Username minimal 3 karakter' };
    }
    if (username.trim().length > 50) {
      return { isValid: false, message: 'Username maksimal 50 karakter' };
    }
    return { isValid: true, message: 'Username valid' };
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { isValid: false, message: 'Format email tidak valid' };
    }
    return { isValid: true, message: 'Email valid' };
  };

  const validatePassword = (password) => {
    if (!password || password.length < 6) {
      return { isValid: false, message: 'Password minimal 6 karakter' };
    }
    if (password.length > 100) {
      return { isValid: false, message: 'Password maksimal 100 karakter' };
    }
    return { isValid: true, message: 'Password valid' };
  };

  // Helper function for input styling
  const getInputStyling = (validation, inputValue) => {
    if (!validation.isValid) {
      return 'border-red-300 focus:ring-red-500';
    }
    if (inputValue && inputValue.length > 0 && validation.isValid) {
      return 'border-green-300 focus:ring-green-500';
    }
    return 'border-gray-300 focus:ring-blue-500';
  };

  // Quick Create User Handlers
  const handleQuickCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const usernameValidation = validateUsername(quickCreateFormData.username);
    const emailValidation = validateEmail(quickCreateFormData.email);
    const passwordValidation = validatePassword(quickCreateFormData.password);
    
    setQuickCreateValidation({
      username: usernameValidation,
      email: emailValidation,
      password: passwordValidation
    });
    
    if (!usernameValidation.isValid || !emailValidation.isValid || !passwordValidation.isValid) {
      setAlert('Mohon periksa kembali data yang diisi', 'danger');
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
      setQuickCreateValidation({
        username: { isValid: true, message: '' },
        email: { isValid: true, message: '' },
        password: { isValid: true, message: '' }
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
    
    // Real-time validation
    if (name === 'username') {
      setQuickCreateValidation(prev => ({
        ...prev,
        username: validateUsername(value)
      }));
    } else if (name === 'email') {
      setQuickCreateValidation(prev => ({
        ...prev,
        email: validateEmail(value)
      }));
    } else if (name === 'password') {
      setQuickCreateValidation(prev => ({
        ...prev,
        password: validatePassword(value)
      }));
    }
  };

  // Enhanced stats with super admin specific data
  const enhancedStats = {
    ...stats,
    adminStats: {
      totalAdmins: stats?.users?.filter(u => u.role === 'admin' || u.role === 'super_admin').length || 0,
      regularAdmins: stats?.users?.filter(u => u.role === 'admin').length || 0,
      superAdmins: stats?.users?.filter(u => u.role === 'super_admin').length || 1,
      totalUsers: stats?.users?.filter(u => u.role === 'user').length || 0
    }
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

            {/* Enhanced Super Admin Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center">
                  <i className="fas fa-crown text-xl"></i>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                  <p className="text-purple-600 font-medium">
                    Selamat datang, {user?.username || 'Super Admin'}!
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Hak Akses Penuh</p>
                    <p className="font-semibold">Kelola seluruh sistem & administrator</p>
                  </div>
                  <button
                    onClick={() => setShowQuickCreateModal(true)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Quick Create User
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {/* Row 1: Enhanced Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Users */}
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="bg-blue-500 p-3 rounded-lg">
                        <i className="fas fa-users text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {enhancedStats.adminStats.totalUsers}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Administrators */}
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="bg-red-500 p-3 rounded-lg">
                        <i className="fas fa-user-shield text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Administrators</p>
                        <p className="text-2xl font-bold text-red-600">
                          {enhancedStats.adminStats.regularAdmins}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Super Admins */}
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="bg-purple-500 p-3 rounded-lg">
                        <i className="fas fa-crown text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Super Admins</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {enhancedStats.adminStats.superAdmins}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Bus */}
                  <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center">
                      <div className="bg-green-500 p-3 rounded-lg">
                        <i className="fas fa-bus text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Bus</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats?.totalBuses || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Management Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Super Admin Actions */}
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
                        <span className="font-medium">Buat User Terverifikasi</span>
                        <p className="text-sm text-gray-600 ml-6">Bypass OTP - langsung aktif</p>
                      </button>

                      <Link 
                        to="/admin/users" 
                        className="block w-full text-left p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-users-cog mr-3 text-red-600"></i>
                        <span className="font-medium">Kelola Semua User & Admin</span>
                        <p className="text-sm text-gray-600 ml-6">Manajemen role & permissions</p>
                      </Link>

                      <Link 
                        to="/admin/tickets" 
                        className="block w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-ticket-alt mr-3 text-orange-600"></i>
                        <span className="font-medium">Monitoring Tiket System</span>
                        <p className="text-sm text-gray-600 ml-6">Oversight seluruh transaksi</p>
                      </Link>
                    </div>
                  </div>

                  {/* System Management */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                      <i className="fas fa-cogs text-gray-600 mr-2"></i>
                      System Management
                    </h3>
                    <div className="space-y-3">
                      <Link 
                        to="/admin/buses" 
                        className="block w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-bus mr-3 text-green-600"></i>
                        <span className="font-medium">Kelola Armada Bus</span>
                        <p className="text-sm text-gray-600 ml-6">Manajemen bus & kapasitas</p>
                      </Link>

                      <Link 
                        to="/admin/routes" 
                        className="block w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-route mr-3 text-blue-600"></i>
                        <span className="font-medium">Kelola Rute Perjalanan</span>
                        <p className="text-sm text-gray-600 ml-6">Jadwal & harga tiket</p>
                      </Link>

                      <div className="p-3 bg-gray-50 rounded-lg">
                        <i className="fas fa-chart-line mr-3 text-gray-600"></i>
                        <span className="font-medium">Analytics & Reports</span>
                        <p className="text-sm text-gray-600 ml-6">Coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Detailed Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserStatsWidget
                    stats={stats || {}}
                    loading={isLoading}
                  />

                  {/* Admin Overview Widget */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4">Administrator Overview</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                          <span>Super Administrators</span>
                        </div>
                        <span className="font-semibold">{enhancedStats.adminStats.superAdmins}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <span>Regular Administrators</span>
                        </div>
                        <span className="font-semibold">{enhancedStats.adminStats.regularAdmins}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                          <span>Regular Users</span>
                        </div>
                        <span className="font-semibold">{enhancedStats.adminStats.totalUsers}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <div className="flex items-center">
                        <i className="fas fa-shield-alt text-purple-600 mr-2"></i>
                        <span className="text-purple-800 text-sm font-medium">
                          Sistem role hierarchy aktif
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 4: Recent Activities */}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Quick Create User
                </h3>
                <p className="text-sm text-purple-600 mt-1">
                  <i className="fas fa-crown mr-1"></i>
                  Bypass OTP - User langsung aktif
                </p>
              </div>
              <button
                onClick={() => setShowQuickCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleQuickCreateSubmit}>
              <div className="space-y-3 sm:space-y-4">
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${getInputStyling(quickCreateValidation.username, quickCreateFormData.username)}`}
                    placeholder="Masukkan username"
                    required
                  />
                  {quickCreateFormData.username.length > 0 && (
                    <p className={`text-xs mt-1 ${
                      quickCreateValidation.username.isValid ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <i className={`fas ${
                        quickCreateValidation.username.isValid ? 'fa-check-circle' : 'fa-times-circle'
                      } mr-1`}></i>
                      {quickCreateValidation.username.message}
                    </p>
                  )}
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${getInputStyling(quickCreateValidation.email, quickCreateFormData.email)}`}
                    placeholder="user@example.com"
                    required
                  />
                  {quickCreateFormData.email.length > 0 && (
                    <p className={`text-xs mt-1 ${
                      quickCreateValidation.email.isValid ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <i className={`fas ${
                        quickCreateValidation.email.isValid ? 'fa-check-circle' : 'fa-times-circle'
                      } mr-1`}></i>
                      {quickCreateValidation.email.message}
                    </p>
                  )}
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
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${getInputStyling(quickCreateValidation.password, quickCreateFormData.password)}`}
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  {quickCreateFormData.password.length > 0 && (
                    <p className={`text-xs mt-1 ${
                      quickCreateValidation.password.isValid ? 'text-green-600' : 'text-red-500'
                    }`}>
                      <i className={`fas ${
                        quickCreateValidation.password.isValid ? 'fa-check-circle' : 'fa-times-circle'
                      } mr-1`}></i>
                      {quickCreateValidation.password.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon <span className="text-gray-400">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    name="no_telepon"
                    value={quickCreateFormData.no_telepon}
                    onChange={handleQuickCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="user">User - Pengguna biasa</option>
                    <option value="admin">Admin - Administrator sistem</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    <i className="fas fa-info-circle mr-1"></i>
                    User akan langsung aktif tanpa verifikasi email
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowQuickCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!quickCreateValidation.username.isValid || 
                           !quickCreateValidation.email.isValid || 
                           !quickCreateValidation.password.isValid ||
                           !quickCreateFormData.username || 
                           !quickCreateFormData.email || 
                           !quickCreateFormData.password}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm ${
                    quickCreateValidation.username.isValid && 
                    quickCreateValidation.email.isValid && 
                    quickCreateValidation.password.isValid &&
                    quickCreateFormData.username && 
                    quickCreateFormData.email && 
                    quickCreateFormData.password
                      ? 'bg-purple-500 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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