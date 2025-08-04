import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import {
  getAllUsers,
  deleteUser,
  makeUserAdmin,
  updateUser
} from '../../redux/actions/adminActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatDate } from '../../utils/formatters';

const UserList = ({
  getAllUsers,
  deleteUser,
  makeUserAdmin,
  updateUser,
  setAlert,
  users,
  loading,
  error,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    no_telepon: ''
  });

  useEffect(() => {
    getAllUsers();
  }, [getAllUsers]);

  // Filter users based on search and role
  useEffect(() => {
    if (users) {
      let filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filterRole !== 'all') {
        filtered = filtered.filter(user => user.role === filterRole);
      }

      setFilteredUsers(filtered);
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  }, [users, searchTerm, filterRole]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    document.querySelector('.user-table-container')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // TAMBAH: Helper function untuk check permission
  const canEditUser = (targetUser) => {
    if (!currentUser) return false;
    
    // Super admin can edit anyone except other super_admins
    if (currentUser.role === 'super_admin') {
      return targetUser.role !== 'super_admin';
    }
    
    // Admin can only edit regular users
    if (currentUser.role === 'admin') {
      return targetUser.role === 'user';
    }
    
    return false;
  };

  const canDeleteUser = (targetUser) => {
    if (!currentUser) return false;
    
    // Super admin can delete anyone except other super_admins
    if (currentUser.role === 'super_admin') {
      return targetUser.role !== 'super_admin';
    }
    
    // Admin can only delete regular users
    if (currentUser.role === 'admin') {
      return targetUser.role === 'user';
    }
    
    return false;
  };

  const canMakeAdmin = (targetUser) => {
    if (!currentUser) return false;
    
    // Only regular users can be made admin, and super_admin cannot be changed
    return targetUser.role === 'user';
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id_user);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleMakeAdmin = (userId, username) => {
    if (window.confirm(`Jadikan ${username} sebagai admin?`)) {
      makeUserAdmin(userId);
    }
  };

  // Edit handlers
  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      no_telepon: user.no_telepon || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (userToEdit) {
      updateUser(userToEdit.id_user, editFormData);
      setShowEditModal(false);
      setUserToEdit(null);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 user-table-container">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold">Kelola User</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <span className="bg-pink-100 text-pink-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
            Total: {filteredUsers.length}
          </span>
          {filteredUsers.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-600">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} dari {filteredUsers.length}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <input
            type="text"
            placeholder="Cari username atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 per halaman</option>
            <option value={10}>10 per halaman</option>
            <option value={25}>25 per halaman</option>
            <option value={50}>50 per halaman</option>
          </select>
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Terdaftar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">👥</div>
                  <p>Tidak ada user yang ditemukan</p>
                </td>
              </tr>
            ) : (
              currentUsers.map((user) => (
                <tr key={user.id_user} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-600' 
                          : user.role === 'admin' 
                          ? 'bg-red-600' 
                          : 'bg-pink-500'
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
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id_user}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.no_telepon || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'super_admin' ? 'Super Admin' :
                        user.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* HIERARCHICAL EDIT BUTTON */}
                      {canEditUser(user) && (
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-green-600 hover:text-green-900 text-sm px-3 py-1 rounded border border-green-600 hover:bg-green-50 transition-colors"
                          title="Edit User"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </button>
                      )}

                      {/* MAKE ADMIN BUTTON */}
                      {canMakeAdmin(user) && (
                        <button
                          onClick={() => handleMakeAdmin(user.id_user, user.username)}
                          className="text-pink-600 hover:text-pink-900 text-sm px-3 py-1 rounded border border-pink-600 hover:bg-blue-50 transition-colors"
                          title="Jadikan Admin"
                        >
                          <i className="fas fa-user-shield mr-1"></i>
                          Admin
                        </button>
                      )}

                      {/* HIERARCHICAL DELETE BUTTON */}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus User"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {currentUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-sm">Tidak ada user yang ditemukan</p>
          </div>
        ) : (
          currentUsers.map((user) => (
            <div key={user.id_user} className="bg-gray-50 rounded-lg p-4 border">
              {/* User Info */}
              <div className="flex items-start space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                  user.role === 'super_admin' 
                    ? 'bg-purple-600' 
                    : user.role === 'admin' 
                    ? 'bg-red-600' 
                    : 'bg-pink-500'
                }`}>
                  {user.role === 'super_admin' ? (
                    <i className="fas fa-crown text-sm"></i>
                  ) : user.role === 'admin' ? (
                    <i className="fas fa-user-shield text-sm"></i>
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {user.username}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                      user.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'super_admin' ? 'Super Admin' :
                        user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">ID: {user.id_user}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 mb-3">
                <p className="text-xs text-gray-900 break-all">{user.email}</p>
                <p className="text-xs text-gray-500">{user.no_telepon || 'No. Telepon: -'}</p>
                <p className="text-xs text-gray-500">Terdaftar: {formatDate(user.created_at)}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {/* HIERARCHICAL EDIT BUTTON - MOBILE */}
                {canEditUser(user) && (
                  <button
                    onClick={() => handleEditClick(user)}
                    className="flex-1 min-w-0 text-green-600 hover:text-green-900 text-xs px-3 py-2 rounded border border-green-600 hover:bg-green-50 transition-colors text-center"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                )}

                {/* MAKE ADMIN BUTTON - MOBILE */}
                {canMakeAdmin(user) && (
                  <button
                    onClick={() => handleMakeAdmin(user.id_user, user.username)}
                    className="flex-1 min-w-0 text-pink-600 hover:text-pink-900 text-xs px-3 py-2 rounded border border-pink-600 hover:bg-blue-50 transition-colors text-center"
                  >
                    <i className="fas fa-user-shield mr-1"></i>
                    Admin
                  </button>
                )}

                {/* HIERARCHICAL DELETE BUTTON - MOBILE */}
                {canDeleteUser(user) && (
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="flex-1 min-w-0 text-red-600 hover:text-red-900 text-xs px-3 py-2 rounded border border-red-600 hover:bg-red-50 transition-colors text-center"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-700">
            Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
            <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> dari{' '}
            <span className="font-medium">{filteredUsers.length}</span> hasil
          </div>

          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded text-sm ${currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  disabled={page === '...'}
                  className={`px-3 py-1 rounded text-sm ${page === currentPage
                    ? 'bg-pink-500 text-white'
                    : page === '...'
                      ? 'bg-white text-gray-400 cursor-default'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded text-sm ${currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && userToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    name="no_telepon"
                    value={editFormData.no_telepon}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opsional"
                  />
                </div>

                {/* Info Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      userToEdit.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800'
                        : userToEdit.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {userToEdit.role === 'super_admin' ? 'Super Administrator' :
                        userToEdit.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                    {userToEdit.role === 'user' && (
                      <span className="text-xs text-gray-500">
                        (Gunakan tombol "Admin" untuk mengubah role)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                >
                  <i className="fas fa-save mr-2"></i>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>

            <p className="text-gray-700 mb-6 text-sm sm:text-base">
              Apakah Anda yakin ingin menghapus user <strong>{userToDelete.username}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                <i className="fas fa-trash mr-2"></i>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

UserList.propTypes = {
  getAllUsers: PropTypes.func.isRequired,
  deleteUser: PropTypes.func.isRequired,
  makeUserAdmin: PropTypes.func.isRequired,
  updateUser: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  users: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  currentUser: PropTypes.object
};

const mapStateToProps = state => ({
  users: state.admin.users,
  loading: state.admin.loading,
  error: state.admin.error,
  currentUser: state.auth.user
});

export default connect(mapStateToProps, {
  getAllUsers,
  deleteUser,
  makeUserAdmin,
  updateUser,
  setAlert
})(UserList);