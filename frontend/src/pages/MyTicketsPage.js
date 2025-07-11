import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { getUserTickets } from '../redux/actions/tiketActions';
import { createPaymentToken } from '../redux/actions/paymentActions';
import { setAlert } from '../redux/actions/alertActions';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../utils/formatters';

const MyTicketsPage = ({ getUserTickets, createPaymentToken, setAlert, tickets, loading, error }) => {
  const [filter, setFilter] = useState('all');
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    getUserTickets();
  }, [getUserTickets]);
  
  // Group tickets by order and filter based on status
  useEffect(() => {
    if (tickets) {
      // Group tickets by order_group_id
      const groupedOrders = [];
      const processedTickets = new Set();
      
      tickets.forEach(ticket => {
        if (processedTickets.has(ticket.id_tiket)) return;
        
        if (ticket.order_group_id) {
          // Find all tickets in the same order group
          const orderTickets = tickets.filter(t => 
            t.order_group_id === ticket.order_group_id
          );
          
          // Mark all tickets in this group as processed
          orderTickets.forEach(t => processedTickets.add(t.id_tiket));
          
          // Create order object
          const masterTicket = orderTickets.find(t => t.is_master_ticket) || orderTickets[0];
          const allSeats = orderTickets.map(t => t.nomor_kursi).sort();
          const totalAmount = orderTickets.reduce((sum, t) => sum + parseFloat(t.total_bayar || 0), 0);
          
          groupedOrders.push({
            type: 'order',
            order_group_id: ticket.order_group_id,
            master_ticket_id: masterTicket.id_tiket,
            total_tickets: orderTickets.length,
            seats: allSeats,
            status_tiket: masterTicket.status_tiket,
            total_bayar: masterTicket.order_total_amount || totalAmount,
            tanggal_pemesanan: masterTicket.tanggal_pemesanan,
            batas_pembayaran: masterTicket.batas_pembayaran,
            rute: masterTicket.rute || masterTicket.Rute,
            user: masterTicket.user || masterTicket.User,
            pembayaran: masterTicket.pembayaran || masterTicket.Pembayaran,
            tickets: orderTickets
          });
        } else {
          // Single ticket (legacy or single seat orders)
          processedTickets.add(ticket.id_tiket);
          groupedOrders.push({
            type: 'single',
            ...ticket,
            seats: [ticket.nomor_kursi],
            total_tickets: 1
          });
        }
      });
      
      // Apply filter
      let filtered;
      if (filter === 'all') {
        filtered = groupedOrders;
      } else {
        filtered = groupedOrders.filter(order => 
          order.status_tiket.toLowerCase() === filter
        );
      }
      
      // Sort by booking date (newest first)
      filtered.sort((a, b) => new Date(b.tanggal_pemesanan) - new Date(a.tanggal_pemesanan));
      
      setFilteredTickets(filtered);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [tickets, filter]);
  
  const handleFilterChange = e => {
    setFilter(e.target.value);
  };

  const handlePayNow = async (order) => {
    try {
      // Use master ticket ID for payment
      const ticketId = order.master_ticket_id || order.id_tiket;
      setPaymentLoading(ticketId);
      
      const paymentResult = await createPaymentToken(ticketId);
      
      if (paymentResult.success && paymentResult.redirect_url) {
        // Redirect to Midtrans payment page
        window.location.href = paymentResult.redirect_url;
      } else {
        setAlert('Gagal membuat token pembayaran. Silakan coba lagi.', 'danger');
      }
    } catch (error) {
      console.error('Payment token error:', error);
      setAlert('Gagal membuat token pembayaran. Silakan coba lagi.', 'danger');
    } finally {
      setPaymentLoading(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const indexOfLastTicket = currentPage * itemsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  // Handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="container mx-auto px-4 flex justify-center">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />
      
      {/* Alert with proper spacing */}
      <div className="content-with-navbar">
          <Alert />
      </div>

      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Tiket Saya</h1>
              <p className="text-gray-600 text-sm">
                {filteredTickets.length} {filter === 'all' ? 'total' : filter} tiket ditemukan
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <span className="bg-pink-100 text-pink-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                Total: {filteredTickets.length}
              </span>
              {filteredTickets.length > 0 && (
                <span className="text-xs sm:text-sm text-gray-600">
                  Menampilkan {indexOfFirstTicket + 1}-{Math.min(indexOfLastTicket, filteredTickets.length)} dari {filteredTickets.length}
                </span>
              )}
            </div>
          </div>
          
          {/* Filter and Items Per Page Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div>
              <select
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filter}
                onChange={handleFilterChange}
              >
                <option value="all">Semua Tiket</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="pending">Menunggu Pembayaran</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
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
          
          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-5xl text-gray-300 mb-4">
                <i className="fas fa-ticket-alt"></i>
              </div>
              <h2 className="text-xl font-bold mb-2">Tidak Ada Tiket</h2>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? 'Anda belum memiliki tiket. Pesan tiket sekarang untuk perjalanan Anda!' 
                  : `Tidak ada tiket dengan status "${filter}" saat ini.`}
              </p>
              <Link
                to="/search-results"
                className="inline-block px-6 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-700 transition"
              >
                Pesan Tiket
              </Link>
            </div>
          ) : (
            <>
              {/* Tickets List */}
              <div className="space-y-4 mb-8">
                {currentTickets.map(order => {
                  const status = formatStatus(order.status_tiket);
                  const route = order.rute || order.Rute;
                  const ticketId = order.master_ticket_id || order.id_tiket;
                  
                  return (
                    <div 
                      key={order.order_group_id || order.id_tiket} 
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      <div className="p-4 md:p-6">
                        {/* Order Header */}
                        <div className="flex flex-wrap justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center mb-2">
                              <h2 className="text-xl font-bold">{route?.asal} → {route?.tujuan}</h2>
                              {order.type === 'order' && order.total_tickets > 1 && (
                                <span className="ml-3 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                                  {order.total_tickets} Tiket
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`${status.colorClass} font-semibold px-3 py-1 rounded-full text-sm bg-opacity-20`}>
                            {status.text}
                          </div>
                        </div>
                        
                        {/* Trip Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-gray-600 text-sm">Tanggal Keberangkatan</p>
                            <p className="font-semibold">{formatDate(route?.waktu_berangkat)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Jam Berangkat</p>
                            <p className="font-semibold">{formatTime(route?.waktu_berangkat)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Kursi</p>
                            <div className="flex flex-wrap gap-1">
                              {order.seats.map((seat, index) => (
                                <span 
                                  key={index}
                                  className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-medium"
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Order Summary untuk multiple tickets */}
                        {order.type === 'order' && order.total_tickets > 1 && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Detail Order:</span>
                              <span className="font-medium">
                                {order.total_tickets} tiket × {formatCurrency(parseFloat(order.total_bayar) / order.total_tickets)} = {formatCurrency(order.total_bayar)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Satu pembayaran untuk semua tiket dalam order ini
                            </p>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex flex-wrap justify-between items-center border-t pt-4">
                          <div>
                            <p className="text-gray-600 text-sm">Total Bayar</p>
                            <p className="font-bold text-lg">{formatCurrency(order.total_bayar)}</p>
                          </div>
                          
                          <div className="space-x-2">
                            {order.status_tiket === 'pending' && (
                              <button
                                onClick={() => handlePayNow(order)}
                                disabled={paymentLoading === ticketId}
                                className="inline-block px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {paymentLoading === ticketId ? (
                                  <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                    Memproses...
                                  </div>
                                ) : (
                                  'Bayar Sekarang'
                                )}
                              </button>
                            )}
                            
                            <Link
                              to={`/ticket/${ticketId}`}
                              className="inline-block px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm"
                            >
                              Lihat Detail
                            </Link>
                            
                            {order.status_tiket === 'confirmed' && (
                              <button
                                className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                                onClick={() => {
                                  window.open(`/ticket/print/${ticketId}`, '_blank');
                                }}
                              >
                                Cetak Tiket
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{indexOfFirstTicket + 1}</span> sampai{' '}
                    <span className="font-medium">{Math.min(indexOfLastTicket, filteredTickets.length)}</span> dari{' '}
                    <span className="font-medium">{filteredTickets.length}</span> hasil
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 rounded text-sm ${
                        currentPage === 1
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
                          className={`px-3 py-1 rounded text-sm ${
                            page === currentPage
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
                      className={`px-2 py-1 rounded text-sm ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

MyTicketsPage.propTypes = {
  getUserTickets: PropTypes.func.isRequired,
  createPaymentToken: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  tickets: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  tickets: state.tiket.tickets,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { 
  getUserTickets, 
  createPaymentToken, 
  setAlert 
})(MyTicketsPage);