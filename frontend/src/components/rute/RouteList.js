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
import { getAvailableBuses } from '../../redux/actions/busActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';

const RouteList = ({ 
  getAllAdminRoutes, 
  deleteAdminRoute, 
  updateAdminRoute,
  createAdminRoute,
  getAvailableBuses,
  setAlert,
  routes, 
  availableBuses,
  loading, 
  error 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    id_bus: '',
    asal: '',
    tujuan: '',
    waktu_berangkat: '',
    harga: '',
    status: 'aktif'
  });

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

  const [busLoading, setBusLoading] = useState(false);

  useEffect(() => {
    getAllAdminRoutes();
  }, [getAllAdminRoutes]);

  // Load available buses untuk create dengan debug
  const loadAvailableBusesForCreate = async () => {
    try {
      console.log('🔄 Loading available buses for CREATE...');
      setBusLoading(true);
      
      const result = await getAvailableBuses(); // No excludeRouteId
      
      console.log('✅ CREATE - Available buses loaded:', {
        count: result?.data?.length,
        buses: result?.data?.map(b => ({id: b.id_bus, name: b.nama_bus}))
      });
      
    } catch (error) {
      console.error('❌ Error loading available buses for create:', error);
    } finally {
      setBusLoading(false);
    }
  };

  // Load available buses untuk edit dengan debug
  const loadAvailableBusesForEdit = async (routeId) => {
    try {
      console.log('🔄 Loading available buses for EDIT routeId:', routeId);
      setBusLoading(true);
      
      const result = await getAvailableBuses(routeId);
      
      console.log('✅ EDIT - Available buses loaded:', {
        count: result?.data?.length,
        buses: result?.data?.map(b => ({
          id: b.id_bus, 
          name: b.nama_bus, 
          isCurrent: b.isCurrentBus
        }))
      });
      
    } catch (error) {
      console.error('❌ Error loading available buses for edit:', error);
    } finally {
      setBusLoading(false);
    }
  };

  // Create handlers dengan debug
  const handleCreateClick = async () => {
    console.log('🆕 CREATE button clicked');
    
    setCreateFormData({
      id_bus: '',
      asal: '',
      tujuan: '',
      waktu_berangkat: '',
      harga: '',
      status: 'aktif'
    });
    
    // Force refresh routes dulu, lalu load available buses
    await getAllAdminRoutes();
    await loadAvailableBusesForCreate();
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!createFormData.id_bus) {
      setAlert('Silakan pilih bus', 'danger');
      return;
    }
    
    try {
      await createAdminRoute(createFormData);
      setShowCreateModal(false);
      
      // Auto refresh setelah create berhasil
      setTimeout(async () => {
        await getAllAdminRoutes();
      }, 1000);
      
    } catch (error) {
      console.error('Create route error:', error);
    }
  };

  const handleCreateChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value
    });
  };

  // Edit handlers dengan debug
  const handleEditClick = async (route) => {
    console.log('✏️ EDIT button clicked for route:', route.id_rute);
    
    setRouteToEdit(route);
    setEditFormData({
      id_bus: route.id_bus,
      asal: route.asal,
      tujuan: route.tujuan,
      waktu_berangkat: route.waktu_berangkat ? 
        new Date(route.waktu_berangkat).toISOString().slice(0, 16) : '',
      harga: route.harga,
      status: route.status
    });
    
    // Force refresh routes dulu, lalu load available buses  
    await getAllAdminRoutes();
    await loadAvailableBusesForEdit(route.id_rute);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (routeToEdit) {
      try {
        await updateAdminRoute(routeToEdit.id_rute, editFormData);
        setShowEditModal(false);
        setRouteToEdit(null);
        
        // Auto refresh setelah edit berhasil
        setTimeout(async () => {
          await getAllAdminRoutes();
        }, 1000);
        
      } catch (error) {
        console.error('Edit route error:', error);
      }
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Debug render
  console.log('🎨 RouteList render:', {
    routesCount: routes?.length,
    availableBusesCount: availableBuses?.length,
    availableBuses: availableBuses?.map(b => ({id: b.id_bus, name: b.nama_bus}))
  });

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold">Kelola Rute</h2>
        <button
          onClick={handleCreateClick}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          Tambah Rute
        </button>
      </div>

      {/* Routes Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rute</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jadwal & Harga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes && routes.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🚌</div>
                  <p>Tidak ada rute yang ditemukan</p>
                </td>
              </tr>
            ) : (
              routes?.map((route) => (
                <tr key={route.id_rute} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {route.asal} → {route.tujuan}
                    </div>
                    <div className="text-sm text-gray-500">ID: {route.id_rute}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {route.Bus?.nama_bus || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.Bus?.total_kursi || 0} kursi
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(route.waktu_berangkat)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(route.waktu_berangkat)}
                    </div>
                    <div className="text-sm font-semibold text-pink-600">
                      {formatCurrency(route.harga)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      route.status === 'aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(route)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      onClick={() => deleteAdminRoute(route.id_rute)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash"></i> Hapus
                    </button>
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
                {/* Bus Select - DIPERBAIKI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_bus"
                    value={createFormData.id_bus}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={busLoading}
                  >
                    <option value="">
                      {busLoading ? 'Memuat bus...' : 'Pilih Bus'}
                    </option>
                    {availableBuses?.length > 0 ? (
                      availableBuses.map(bus => (
                        <option key={bus.id_bus} value={bus.id_bus}>
                          {bus.nama_bus} ({bus.total_kursi} kursi)
                        </option>
                      ))
                    ) : (
                      !busLoading && (
                        <option disabled>Tidak ada bus tersedia</option>
                      )
                    )}
                  </select>
                  
                  <div className="mt-1 text-xs">
                    {busLoading ? (
                      <span className="text-blue-500">
                        <i className="fas fa-spinner fa-spin mr-1"></i>
                        Memuat data bus...
                      </span>
                    ) : (
                      <>
                        <span className="text-green-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          {availableBuses?.length || 0} bus tersedia
                        </span>
                        {availableBuses?.length === 0 && (
                          <span className="text-red-500 ml-3">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Semua bus sedang digunakan
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Asal & Tujuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="asal"
                      value={createFormData.asal}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Jakarta"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tujuan"
                      value={createFormData.tujuan}
                      onChange={handleCreateChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bandung"
                      required
                    />
                  </div>
                </div>
                
                {/* Waktu & Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Berangkat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="waktu_berangkat"
                    value={createFormData.waktu_berangkat}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="harga"
                    value={createFormData.harga}
                    onChange={handleCreateChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="150000"
                    required
                    min="0"
                  />
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
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  disabled={!availableBuses?.length}
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
                {/* Bus Select - Edit Mode DIPERBAIKI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_bus"
                    value={editFormData.id_bus}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={busLoading}
                  >
                    <option value="">
                      {busLoading ? 'Memuat bus...' : 'Pilih Bus'}
                    </option>
                    {availableBuses?.length > 0 ? (
                      availableBuses.map(bus => (
                        <option key={bus.id_bus} value={bus.id_bus}>
                          {bus.nama_bus} ({bus.total_kursi} kursi)
                          {bus.isCurrentBus ? ' (Saat ini)' : ''}
                        </option>
                      ))
                    ) : (
                      !busLoading && (
                        <option disabled>Tidak ada bus tersedia</option>
                      )
                    )}
                  </select>
                  
                  <div className="mt-1 text-xs">
                    {busLoading ? (
                      <span className="text-blue-500">
                        <i className="fas fa-spinner fa-spin mr-1"></i>
                        Memuat data bus...
                      </span>
                    ) : (
                      <>
                        <span className="text-green-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          {availableBuses?.filter(b => !b.isCurrentBus).length || 0} bus lain tersedia
                        </span>
                        <span className="text-blue-500 ml-3">
                          <i className="fas fa-bus mr-1"></i>
                          Dapat ganti atau tetap gunakan bus saat ini
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Asal & Tujuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="asal"
                      value={editFormData.asal}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="tujuan"
                      value={editFormData.tujuan}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Waktu & Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Berangkat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="waktu_berangkat"
                    value={editFormData.waktu_berangkat}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="harga"
                    value={editFormData.harga}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
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
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <i className="fas fa-save mr-2"></i>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

RouteList.propTypes = {
  getAllAdminRoutes: PropTypes.func.isRequired,
  deleteAdminRoute: PropTypes.func.isRequired,
  updateAdminRoute: PropTypes.func.isRequired,
  createAdminRoute: PropTypes.func.isRequired,
  getAvailableBuses: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  routes: PropTypes.array,
  availableBuses: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  routes: state.routeAdmin ? state.routeAdmin.routes : [],
  availableBuses: state.bus ? state.bus.availableBuses : [],
  loading: state.routeAdmin ? state.routeAdmin.loading : false,
  error: state.routeAdmin ? state.routeAdmin.error : null
});

export default connect(mapStateToProps, { 
  getAllAdminRoutes, 
  deleteAdminRoute, 
  updateAdminRoute,
  createAdminRoute,
  getAvailableBuses,
  setAlert 
})(RouteList);