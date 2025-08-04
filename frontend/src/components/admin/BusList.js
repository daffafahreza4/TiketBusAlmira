import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import {
  getAllBuses,
  deleteBus,
  updateBus,
  createBus
} from '../../redux/actions/busActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatDate } from '../../utils/formatters';

const BusList = ({
  getAllBuses,
  deleteBus,
  updateBus,
  createBus,
  setAlert,
  buses,
  loading,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [busToDelete, setBusToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [busToEdit, setBusToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nama_bus: '',
    total_kursi: ''
  });

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nama_bus: '',
    total_kursi: ''
  });

  // Validation states
  const [createValidation, setCreateValidation] = useState({
    nama_bus: { isValid: true, message: '' }
  });
  const [editValidation, setEditValidation] = useState({
    nama_bus: { isValid: true, message: '' }
  });

  useEffect(() => {
    getAllBuses();
  }, [getAllBuses]);

  // Filter buses based on search
  useEffect(() => {
    if (buses) {
      let filtered = buses.filter(bus =>
        bus.nama_bus.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBuses(filtered);
      setCurrentPage(1);
    }
  }, [buses, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredBuses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBuses = filteredBuses.slice(startIndex, endIndex);

  // FIXED: Updated validation function for 5-30 characters
  const validateBusName = (nama_bus, isEdit = false, currentBusId = null) => {
    const trimmedName = nama_bus ? nama_bus.trim() : '';
    const nameLength = trimmedName.length;

    // Check length range: 5-30 characters
    if (nameLength < 5) {
      return {
        isValid: false,
        message: `Nama bus minimal 5 karakter (${nameLength}/5)`
      };
    }

    if (nameLength > 30) {
      return {
        isValid: false,
        message: `Nama bus maksimal 30 karakter (${nameLength}/30)`
      };
    }

    // Check uniqueness (case-sensitive)
    const existingBus = buses?.find(bus => {
      if (isEdit && bus.id_bus === currentBusId) {
        return false; // Skip current bus when editing
      }
      return bus.nama_bus === trimmedName;
    });

    if (existingBus) {
      return {
        isValid: false,
        message: 'Nama bus sudah digunakan'
      };
    }

    return {
      isValid: true,
      message: `Nama bus valid (${nameLength} karakter)`
    };
  };

  // Helper function to get input styling based on validation
  const getInputStyling = (validation, inputLength) => {
    if (!validation.isValid) {
      return 'border-red-300 focus:ring-red-500';
    }
    if (inputLength >= 5 && inputLength <= 30) {
      return 'border-green-300 focus:ring-green-500';
    }
    if (inputLength > 0) {
      return 'border-yellow-300 focus:ring-yellow-500';
    }
    return 'border-gray-300 focus:ring-blue-500';
  };

  // Helper function to get validation icon and message
  const getValidationFeedback = (validation, inputLength) => {
    if (!validation.isValid) {
      return {
        icon: 'fas fa-times-circle',
        color: 'text-red-500',
        message: validation.message
      };
    }
    if (inputLength >= 5 && inputLength <= 30) {
      return {
        icon: 'fas fa-check-circle',
        color: 'text-green-500',
        message: validation.message
      };
    }
    if (inputLength > 0) {
      if (inputLength < 5) {
        return {
          icon: 'fas fa-info-circle',
          color: 'text-yellow-600',
          message: `Minimal 5 karakter (${inputLength}/5)`
        };
      }
      if (inputLength > 30) {
        return {
          icon: 'fas fa-exclamation-triangle',
          color: 'text-yellow-600',
          message: `Maksimal 30 karakter (${inputLength}/30)`
        };
      }
    }
    return null;
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector('.bus-table-container')?.scrollIntoView({
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

  // Delete handlers
  const handleDeleteClick = (bus) => {
    setBusToDelete(bus);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (busToDelete) {
      deleteBus(busToDelete.id_bus);
      setShowDeleteModal(false);
      setBusToDelete(null);
    }
  };

  // Edit handlers
  const handleEditClick = (bus) => {
    setBusToEdit(bus);
    setEditFormData({
      nama_bus: bus.nama_bus,
      total_kursi: bus.total_kursi
    });
    setEditValidation({
      nama_bus: { isValid: true, message: '' }
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    const busNameValidation = validateBusName(editFormData.nama_bus, true, busToEdit.id_bus);

    if (!busNameValidation.isValid) {
      setAlert(busNameValidation.message, 'danger');
      setEditValidation({
        nama_bus: busNameValidation
      });
      return;
    }

    if (busToEdit) {
      updateBus(busToEdit.id_bus, editFormData);
      setShowEditModal(false);
      setBusToEdit(null);
      setEditValidation({
        nama_bus: { isValid: true, message: '' }
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });

    if (name === 'nama_bus') {
      const validation = validateBusName(value, true, busToEdit.id_bus);
      setEditValidation({
        ...editValidation,
        nama_bus: validation
      });
    }
  };

  // Create handlers
  const handleCreateClick = () => {
    setCreateFormData({
      nama_bus: '',
      total_kursi: ''
    });
    setCreateValidation({
      nama_bus: { isValid: true, message: '' }
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    const busNameValidation = validateBusName(createFormData.nama_bus);

    if (!busNameValidation.isValid) {
      setAlert(busNameValidation.message, 'danger');
      setCreateValidation({
        nama_bus: busNameValidation
      });
      return;
    }

    createBus(createFormData);
    setShowCreateModal(false);
    setCreateValidation({
      nama_bus: { isValid: true, message: '' }
    });
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData({
      ...createFormData,
      [name]: value
    });

    if (name === 'nama_bus') {
      const validation = validateBusName(value);
      setCreateValidation({
        ...createValidation,
        nama_bus: validation
      });
    }
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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 bus-table-container">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold">Kelola Bus</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <span className="bg-pink-100 text-pink-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
            Total: {filteredBuses.length}
          </span>
          {filteredBuses.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-600">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredBuses.length)} dari {filteredBuses.length}
            </span>
          )}
          <button
            onClick={handleCreateClick}
            className="w-full sm:w-auto bg-pink-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm sm:text-base"
          >
            <i className="fas fa-plus mr-2"></i>
            Tambah Bus
          </button>
        </div>
      </div>

      {/* Search and Items Per Page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <input
            type="text"
            placeholder="Cari nama bus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* Buses Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kapasitas Kursi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Layout Kursi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dibuat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentBuses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🚌</div>
                  <p>Tidak ada bus yang ditemukan</p>
                </td>
              </tr>
            ) : (
              currentBuses.map((bus) => (
                <tr key={bus.id_bus} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 bg-pink-500">
                        <i className="fas fa-bus"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {bus.nama_bus}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {bus.id_bus}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {bus.total_kursi} kursi
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <i className="fas fa-couch mr-1"></i>
                        2-2 Configuration
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bus.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(bus)}
                        className="text-green-600 hover:text-green-900 text-sm px-3 py-1 rounded border border-green-600 hover:bg-green-50 transition-colors"
                        title="Edit Bus"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteClick(bus)}
                        className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Bus"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Buses Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {currentBuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🚌</div>
            <p className="text-sm">Tidak ada bus yang ditemukan</p>
          </div>
        ) : (
          currentBuses.map((bus) => (
            <div key={bus.id_bus} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-pink-500">
                  <i className="fas fa-bus text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {bus.nama_bus}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {bus.id_bus}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Kapasitas</p>
                  <p className="text-sm font-semibold text-gray-900">{bus.total_kursi} kursi</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layout</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <i className="fas fa-couch mr-1"></i>
                    2-2
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-500">Dibuat: {formatDate(bus.created_at)}</p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClick(bus)}
                  className="flex-1 text-green-600 hover:text-green-900 text-xs px-3 py-2 rounded border border-green-600 hover:bg-green-50 transition-colors text-center"
                >
                  <i className="fas fa-edit mr-1"></i>
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteClick(bus)}
                  className="flex-1 text-red-600 hover:text-red-900 text-xs px-3 py-2 rounded border border-red-600 hover:bg-red-50 transition-colors text-center"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredBuses.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-700">
            Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
            <span className="font-medium">{Math.min(endIndex, filteredBuses.length)}</span> dari{' '}
            <span className="font-medium">{filteredBuses.length}</span> hasil
          </div>

          <div className="flex items-center space-x-2">
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

      {/* Create Modal - FIXED: 5-30 characters validation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Tambah Bus Baru</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bus<span className="text-xs text-gray-500"></span>
                  </label>
                  <input
                    type="text"
                    name="nama_bus"
                    value={createFormData.nama_bus}
                    onChange={handleCreateChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${getInputStyling(createValidation.nama_bus, createFormData.nama_bus.length)
                      }`}
                    required
                    maxLength="20"
                  />

                  {/* Real-time validation feedback */}
                  {createFormData.nama_bus.length > 0 && (() => {
                    const feedback = getValidationFeedback(createValidation.nama_bus, createFormData.nama_bus.length);
                    return feedback ? (
                      <div className="mt-1">
                        <p className={`text-xs ${feedback.color}`}>
                          <i className={`${feedback.icon} mr-1`}></i>
                          {feedback.message}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Kursi
                  </label>
                  <input
                    type="number"
                    name="total_kursi"
                    value={createFormData.total_kursi}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="40"
                    max="40"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Layout otomatis kursi 2-2
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!createValidation.nama_bus.isValid || createFormData.nama_bus.trim().length < 5 || createFormData.nama_bus.trim().length > 30}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm ${createValidation.nama_bus.isValid &&
                      createFormData.nama_bus.trim().length >= 5 &&
                      createFormData.nama_bus.trim().length <= 30
                      ? 'bg-pink-500 text-white hover:bg-pink-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Tambah Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - FIXED: 5-30 characters validation */}
      {showEditModal && busToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Bus</h3>
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
                    Nama Bus * <span className="text-xs text-gray-500">(5-30 karakter)</span>
                  </label>
                  <input
                    type="text"
                    name="nama_bus"
                    value={editFormData.nama_bus}
                    onChange={handleEditChange}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${getInputStyling(editValidation.nama_bus, editFormData.nama_bus.length)
                      }`}
                    required
                    maxLength="30"
                  />

                  {/* Real-time validation feedback */}
                  {editFormData.nama_bus.length > 0 && (() => {
                    const feedback = getValidationFeedback(editValidation.nama_bus, editFormData.nama_bus.length);
                    return feedback ? (
                      <div className="mt-1">
                        <p className={`text-xs ${feedback.color}`}>
                          <i className={`${feedback.icon} mr-1`}></i>
                          {feedback.message}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Kursi *
                  </label>
                  <input
                    type="number"
                    name="total_kursi"
                    value={editFormData.total_kursi}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="20"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Layout otomatis: 2-2 configuration
                  </p>
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
                  disabled={!editValidation.nama_bus.isValid || editFormData.nama_bus.trim().length < 5 || editFormData.nama_bus.trim().length > 30}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm ${editValidation.nama_bus.isValid &&
                      editFormData.nama_bus.trim().length >= 5 &&
                      editFormData.nama_bus.trim().length <= 30
                      ? 'bg-pink-500 text-white hover:bg-pink-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
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
      {showDeleteModal && busToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>

            <p className="text-gray-700 mb-6 text-sm sm:text-base">
              Apakah Anda yakin ingin menghapus bus <strong>{busToDelete.nama_bus}</strong>?
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

BusList.propTypes = {
  getAllBuses: PropTypes.func.isRequired,
  deleteBus: PropTypes.func.isRequired,
  updateBus: PropTypes.func.isRequired,
  createBus: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  buses: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  buses: state.bus ? state.bus.buses : [],
  loading: state.bus ? state.bus.loading : false,
  error: state.bus ? state.bus.error : null
});

export default connect(mapStateToProps, {
  getAllBuses,
  deleteBus,
  updateBus,
  createBus,
  setAlert
})(BusList);