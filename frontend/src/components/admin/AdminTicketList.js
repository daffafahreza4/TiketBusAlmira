import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import { 
  getAllAdminTickets, 
  updateTicketStatus,
  deleteAdminTicket
} from '../../redux/actions/ticketAdminActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatDate, formatTime, formatCurrency, formatStatus } from '../../utils/formatters';

const AdminTicketList = ({ 
  getAllAdminTickets, 
  updateTicketStatus,
  deleteAdminTicket,
  setAlert,
  tickets, 
  loading, 
  error 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [ticketToUpdate, setTicketToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  useEffect(() => {
    console.log('🔍 [AdminTicketList] Component mounted, fetching tickets...');
    getAllAdminTickets();
  }, [getAllAdminTickets]);

  // Filter tickets based on search and status
  useEffect(() => {
    if (tickets) {
      console.log('🔍 [AdminTicketList] Filtering tickets:', { 
        totalTickets: tickets.length, 
        searchTerm, 
        filterStatus 
      });
      
      let filtered = tickets.filter(ticket => 
        ticket.User?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.Rute?.asal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.Rute?.tujuan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id_tiket.toString().includes(searchTerm)
      );

      if (filterStatus !== 'all') {
        filtered = filtered.filter(ticket => ticket.status_tiket === filterStatus);
      }

      setFilteredTickets(filtered);
      console.log('✅ [AdminTicketList] Filtered tickets:', filtered.length);
    }
  }, [tickets, searchTerm, filterStatus]);

  // Status update handlers
  const handleStatusClick = (ticket) => {
    console.log('🔍 [AdminTicketList] Opening status modal for ticket:', ticket.id_tiket);
    setTicketToUpdate(ticket);
    setNewStatus(ticket.status_tiket);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = () => {
    if (ticketToUpdate && newStatus !== ticketToUpdate.status_tiket) {
      console.log('🔍 [AdminTicketList] Updating ticket status:', {
        ticketId: ticketToUpdate.id_tiket,
        oldStatus: ticketToUpdate.status_tiket,
        newStatus
      });
      
      updateTicketStatus(ticketToUpdate.id_tiket, { status_tiket: newStatus });
    }
    setShowStatusModal(false);
    setTicketToUpdate(null);
  };

  // Delete handlers
  const handleDeleteClick = (ticket) => {
    console.log('🔍 [AdminTicketList] Opening delete modal for ticket:', ticket.id_tiket);
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      console.log('🔍 [AdminTicketList] Deleting ticket:', ticketToDelete.id_tiket);
      deleteAdminTicket(ticketToDelete.id_tiket);
      setShowDeleteModal(false);
      setTicketToDelete(null);
    }
  };

  if (loading) {
    console.log('🔍 [AdminTicketList] Loading state');
    return <Spinner />;
  }

  if (error) {
    console.error('❌ [AdminTicketList] Error state:', error);
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  console.log('🔍 [AdminTicketList] Rendering with:', {
    totalTickets: tickets?.length || 0,
    filteredTickets: filteredTickets.length,
    loading,
    error
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Kelola Tiket</h2>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            Total: {tickets ? tickets.length : 0}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Cari ID tiket, penumpang, atau rute..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiket & Penumpang
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rute & Jadwal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detail
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
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🎫</div>
                  <p>Tidak ada tiket yang ditemukan</p>
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const status = formatStatus(ticket.status_tiket);
                return (
                  <tr key={ticket.id_tiket} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 bg-purple-600">
                          <i className="fas fa-ticket-alt"></i>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            ID: {ticket.id_tiket}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.User?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.User?.email || 'No Email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">
                        {ticket.Rute?.asal || 'N/A'} → {ticket.Rute?.tujuan || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.Rute?.waktu_berangkat ? formatDate(ticket.Rute.waktu_berangkat) : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.Rute?.waktu_berangkat ? formatTime(ticket.Rute.waktu_berangkat) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Kursi: <span className="font-semibold">{ticket.nomor_kursi}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(ticket.total_bayar)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Bus: {ticket.Rute?.Bus?.nama_bus || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusClick(ticket)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        {status.text}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusClick(ticket)}
                          className="text-blue-600 hover:text-blue-900 text-sm px-3 py-1 rounded border border-blue-600 hover:bg-blue-50 transition-colors"
                          title="Update Status"
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Status
                        </button>
                        
                        <button
                          onClick={() => handleDeleteClick(ticket)}
                          className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Tiket"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && ticketToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Update Status Tiket</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Tiket ID: <strong>{ticketToUpdate.id_tiket}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Penumpang: <strong>{ticketToUpdate.User?.username}</strong>
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Baru
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleStatusSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-save mr-2"></i>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus tiket <strong>ID: {ticketToDelete.id_tiket}</strong> 
              milik <strong>{ticketToDelete.User?.username}</strong>? 
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

AdminTicketList.propTypes = {
  getAllAdminTickets: PropTypes.func.isRequired,
  updateTicketStatus: PropTypes.func.isRequired,
  deleteAdminTicket: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  tickets: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  tickets: state.ticketAdmin ? state.ticketAdmin.tickets : [],
  loading: state.ticketAdmin ? state.ticketAdmin.loading : false,
  error: state.ticketAdmin ? state.ticketAdmin.error : null
});

export default connect(mapStateToProps, { 
  getAllAdminTickets, 
  updateTicketStatus,
  deleteAdminTicket,
  setAlert 
})(AdminTicketList);