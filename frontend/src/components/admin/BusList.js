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
    }
  }, [buses, searchTerm]);

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
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (busToEdit) {
      updateBus(busToEdit.id_bus, editFormData);
      setShowEditModal(false);
      setBusToEdit(null);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Create handlers
  const handleCreateClick = () => {
    setCreateFormData({
      nama_bus: '',
      total_kursi: ''
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createBus(createFormData);
    setShowCreateModal(false);
  };

  const handleCreateChange = (e) => {
    setCreateFormData({
      ...createFormData,
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Kelola Bus</h2>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            Total: {buses ? buses.length : 0}
          </span>
          <button
            onClick={handleCreateClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Tambah Bus
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari nama bus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buses Table */}
      <div className="overflow-x-auto">
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
            {filteredBuses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🚌</div>
                  <p>Tidak ada bus yang ditemukan</p>
                </td>
              </tr>
            ) : (
              filteredBuses.map((bus) => (
                <tr key={bus.id_bus} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 bg-blue-600">
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tambah Bus Baru</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bus
                  </label>
                  <input
                    type="text"
                    name="nama_bus"
                    value={createFormData.nama_bus}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Sinar Jaya Express"
                    required
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: 40"
                    required
                    min="20"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Layout otomatis: 2-2 configuration (20-60 kursi)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Tambah Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && busToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Bus</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bus
                  </label>
                  <input
                    type="text"
                    name="nama_bus"
                    value={editFormData.nama_bus}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Kursi
                  </label>
                  <input
                    type="number"
                    name="total_kursi"
                    value={editFormData.total_kursi}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="20"
                    max="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Layout otomatis: 2-2 configuration
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus bus <strong>{busToDelete.nama_bus}</strong>? 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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