import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import { 
  getAllAdminRoutes, 
  deleteAdminRoute, 
  updateAdminRoute,
  createAdminRoute  
} from '../../redux/actions/routeAdminActions';
import { getAllBuses } from '../../redux/actions/busActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';

const AdminRouteList = ({ 
  getAllAdminRoutes, 
  deleteAdminRoute, 
  updateAdminRoute,
  createAdminRoute,
  getAllBuses,
  setAlert,
  routes, 
  buses,
  loading, 
  error 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id_bus: '',
    asal: '',
    tujuan: '',
    waktu_berangkat: '',
    harga: '',
    status: 'aktif'
  });

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    id_bus: '',
    asal: '',
    tujuan: '',
    waktu_berangkat: '',
    harga: '',
    status: 'aktif'
  });

  useEffect(() => {
    getAllAdminRoutes();
    getAllBuses(); // Fetch buses for dropdown
  }, [getAllAdminRoutes, getAllBuses]);

  // Filter routes based on search and status
  useEffect(() => {
    if (routes) {
      let filtered = routes.filter(route => 
        route.asal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.tujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (route.Bus && route.Bus.nama_bus.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      if (filterStatus !== 'all') {
        filtered = filtered.filter(route => route.status === filterStatus);
      }

      setFilteredRoutes(filtered);
    }
  }, [routes, searchTerm, filterStatus]);

  // Delete handlers
  const handleDeleteClick = (route) => {
    setRouteToDelete(route);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (routeToDelete) {
      deleteAdminRoute(routeToDelete.id_rute);
      setShowDeleteModal(false);
      setRouteToDelete(null);
    }
  };

  // Edit handlers
  const handleEditClick = (route) => {
    setRouteToEdit(route);
    
    // Format datetime for input field
    const formattedDateTime = new Date(route.waktu_berangkat).toISOString().slice(0, 16);
    
    setEditFormData({
      id_bus: route.id_bus,
      asal: route.asal,
      tujuan: route.tujuan,
      waktu_berangkat: formattedDateTime,
      harga: route.harga,
      status: route.status
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (routeToEdit) {
      updateAdminRoute(routeToEdit.id_rute, editFormData);
      setShowEditModal(false);
      setRouteToEdit(null);
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
      id_bus: '',
      asal: '',
      tujuan: '',
      waktu_berangkat: '',
      harga: '',
      status: 'aktif'
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createAdminRoute(createFormData);
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
        <h2 className="text-xl font-bold">Kelola Rute</h2>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            Total: {routes ? routes.length : 0}
          </span>
          <button
            onClick={handleCreateClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Tambah Rute
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <input
            type="text"
            placeholder="Cari asal, tujuan, atau nama bus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Non-aktif</option>
          </select>
        </div>
      </div>

      {/* Routes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rute & Bus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jadwal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRoutes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🚌</div>
                  <p>Tidak ada rute yang ditemukan</p>
                </td>
              </tr>
            ) : (
              filteredRoutes.map((route) => (
                <tr key={route.id_rute} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 bg-green-600">
                        <i className="fas fa-route"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {route.asal} → {route.tujuan}
                        </div>
                        <div className="text-sm text-gray-500">
                          Bus: {route.Bus ? route.Bus.nama_bus : 'Bus Tidak Diketahui'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {formatDate(route.waktu_berangkat)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(route.waktu_berangkat)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(route.harga)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.status === 'aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.status === 'aktif' ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(route)}
                        className="text-green-600 hover:text-green-900 text-sm px-3 py-1 rounded border border-green-600 hover:bg-green-50 transition-colors"
                        title="Edit Rute"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(route)}
                        className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Rute"
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
              <h3 className="text-lg font-bold text-gray-900">Tambah Rute Baru</h3>
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
                    Bus
                  </label>
                  <select
                    name="id_bus"
                    value={createFormData.id_bus}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Bus</option>
                    {buses && buses.map(bus => (
                      <option key={bus.id_bus} value={bus.id_bus}>
                        {bus.nama_bus} ({bus.total_kursi} kursi)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asal
                    </label>
                    <input
                      type="text"
                      name="asal"
                      value={createFormData.asal}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jakarta"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan
                    </label>
                    <input
                      type="text"
                      name="tujuan"
                      value={createFormData.tujuan}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bandung"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Berangkat
                  </label>
                  <input
                    type="datetime-local"
                    name="waktu_berangkat"
                    value={createFormData.waktu_berangkat}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga
                  </label>
                  <input
                    type="number"
                    name="harga"
                    value={createFormData.harga}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={createFormData.status}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
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
                  Tambah Rute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && routeToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Rute</h3>
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
                    Bus
                  </label>
                  <select
                    name="id_bus"
                    value={editFormData.id_bus}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Bus</option>
                    {buses && buses.map(bus => (
                      <option key={bus.id_bus} value={bus.id_bus}>
                        {bus.nama_bus} ({bus.total_kursi} kursi)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asal
                    </label>
                    <input
                      type="text"
                      name="asal"
                      value={editFormData.asal}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan
                    </label>
                    <input
                      type="text"
                      name="tujuan"
                      value={editFormData.tujuan}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Berangkat
                  </label>
                  <input
                    type="datetime-local"
                    name="waktu_berangkat"
                    value={editFormData.waktu_berangkat}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga
                  </label>
                  <input
                    type="number"
                    name="harga"
                    value={editFormData.harga}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
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
      {showDeleteModal && routeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus rute <strong>{routeToDelete.asal} → {routeToDelete.tujuan}</strong>? 
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

AdminRouteList.propTypes = {
  getAllAdminRoutes: PropTypes.func.isRequired,
  deleteAdminRoute: PropTypes.func.isRequired,
  updateAdminRoute: PropTypes.func.isRequired,
  createAdminRoute: PropTypes.func.isRequired,
  getAllBuses: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  routes: PropTypes.array,
  buses: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  routes: state.routeAdmin ? state.routeAdmin.routes : [],
  buses: state.bus ? state.bus.buses : [],
  loading: state.routeAdmin ? state.routeAdmin.loading : false,
  error: state.routeAdmin ? state.routeAdmin.error : null
});

export default connect(mapStateToProps, { 
  getAllAdminRoutes, 
  deleteAdminRoute, 
  updateAdminRoute,
  createAdminRoute,
  getAllBuses,
  setAlert 
})(AdminRouteList);