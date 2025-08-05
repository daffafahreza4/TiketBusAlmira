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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    getAllAdminTickets();
  }, [getAllAdminTickets]);

  // Filter tickets based on search and status
  useEffect(() => {
    if (tickets) {
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
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  }, [tickets, searchTerm, filterStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    document.querySelector('.ticket-table-container')?.scrollIntoView({
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

  // Status update handlers
  const handleStatusClick = (ticket) => {
    setTicketToUpdate(ticket);
    setNewStatus(ticket.status_tiket);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = () => {
    if (ticketToUpdate && newStatus !== ticketToUpdate.status_tiket) {
      updateTicketStatus(ticketToUpdate.id_tiket, { status_tiket: newStatus });
    }
    setShowStatusModal(false);
    setTicketToUpdate(null);
  };

  // Delete handlers
  const handleDeleteClick = (ticket) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      deleteAdminTicket(ticketToDelete.id_tiket);
      setShowDeleteModal(false);
      setTicketToDelete(null);
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

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
    { value: 'completed', label: 'Completed', color: 'bg-pink-100 text-pink-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 ticket-table-container">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-bold">Kelola Tiket</h2>
        <div className="flex items-center space-x-4">
          <span className="bg-pink-100 text-pink-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
            Total: {filteredTickets.length}
          </span>
          {filteredTickets.length > 0 && (
            <span className="text-xs sm:text-sm text-gray-600">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredTickets.length)} dari {filteredTickets.length}
            </span>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <input
            type="text"
            placeholder="Cari ID tiket, penumpang, atau rute..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="expired">Kadaluarsa</option>
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

      {/* Tickets Table - Desktop */}
      <div className="hidden lg:block overflow-x-auto">
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
            {currentTickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">🎫</div>
                  <p>Tidak ada tiket yang ditemukan</p>
                </td>
              </tr>
            ) : (
              currentTickets.map((ticket) => {
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
                          className="text-pink-600 hover:text-pink-900 text-sm px-3 py-1 rounded border border-pink-600 hover:bg-blue-50 transition-colors"
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

      {/* Tickets Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {currentTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎫</div>
            <p className="text-sm">Tidak ada tiket yang ditemukan</p>
          </div>
        ) : (
          currentTickets.map((ticket) => {
            const status = formatStatus(ticket.status_tiket);
            return (
              <div key={ticket.id_tiket} className="bg-gray-50 rounded-lg p-4 border">
                {/* Ticket Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-purple-600">
                    <i className="fas fa-ticket-alt text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        ID: {ticket.id_tiket}
                      </h3>
                      <button
                        onClick={() => handleStatusClick(ticket)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        {status.text}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {ticket.User?.username || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {ticket.User?.email || 'No Email'}
                    </p>
                  </div>
                </div>

                {/* Route Info */}
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {ticket.Rute?.asal || 'N/A'} → {ticket.Rute?.tujuan || 'N/A'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>
                      <p>Tanggal:</p>
                      <p className="font-medium text-gray-700">
                        {ticket.Rute?.waktu_berangkat ? formatDate(ticket.Rute.waktu_berangkat) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p>Waktu:</p>
                      <p className="font-medium text-gray-700">
                        {ticket.Rute?.waktu_berangkat ? formatTime(ticket.Rute.waktu_berangkat) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-gray-500">Kursi:</p>
                    <p className="font-semibold text-gray-900">{ticket.nomor_kursi}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Harga:</p>
                    <p className="font-semibold text-pink-600">{formatCurrency(ticket.total_bayar)}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500">Bus: {ticket.Rute?.Bus?.nama_bus || 'N/A'}</p>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusClick(ticket)}
                    className="flex-1 text-pink-600 hover:text-pink-900 text-xs px-3 py-2 rounded border border-pink-600 hover:bg-blue-50 transition-colors text-center"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Status
                  </button>

                  <button
                    onClick={() => handleDeleteClick(ticket)}
                    className="flex-1 text-red-600 hover:text-red-900 text-xs px-3 py-2 rounded border border-red-600 hover:bg-red-50 transition-colors text-center"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredTickets.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-700">
            Menampilkan <span className="font-medium">{startIndex + 1}</span> sampai{' '}
            <span className="font-medium">{Math.min(endIndex, filteredTickets.length)}</span> dari{' '}
            <span className="font-medium">{filteredTickets.length}</span> hasil
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

      {/* Status Update Modal */}
      {showStatusModal && ticketToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Update Status Tiket</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
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
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleStatusSubmit}
                className="w-full sm:w-auto px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                <i className="fas fa-exclamation-triangle text-red-600"></i>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
            </div>

            <p className="text-gray-700 mb-6 text-sm sm:text-base">
              Apakah Anda yakin ingin menghapus tiket <strong>ID: {ticketToDelete.id_tiket}</strong>
              milik <strong>{ticketToDelete.User?.username}</strong>?
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