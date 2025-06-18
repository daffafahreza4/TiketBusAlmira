import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { getGroupedTicketById, cancelTicket } from '../redux/actions/tiketActions';
import { createPaymentToken } from '../redux/actions/paymentActions';
import { setAlert } from '../redux/actions/alertActions';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../utils/formatters';

const TicketDetailPage = ({
  getGroupedTicketById,
  cancelTicket,
  createPaymentToken,
  setAlert,
  ticket,
  loading,
  error
}) => {
  const { id } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getGroupedTicketById(id); 
    }
  }, [getGroupedTicketById, id]);

  // Helper function to safely access route data
  const getRouteData = (ticketData) => {
    // Handle grouped order structure
    if (ticketData?.route) {
      return ticketData.route;
    }
    // Fallback to individual ticket structure
    return ticketData?.rute || ticketData?.Rute || {};
  };

  // Helper function to safely access user data  
  const getUserData = (ticketData) => {
    return ticketData?.user || ticketData?.User || {};
  };

  // Helper function to safely access payment data
  const getPaymentData = (ticketData) => {
    return ticketData?.payment || ticketData?.pembayaran || ticketData?.Pembayaran || {};
  };

  // Helper function to get order/ticket data
  const getOrderData = (ticketData) => {
    return ticketData?.order || null;
  };

  // Helper function to get tickets array for grouped orders
  const getTicketsData = (ticketData) => {
    return ticketData?.tickets || [];
  };

  const handlePrintTicket = () => {
    window.open(`/ticket/print/${id}`, '_blank');
  };

  const handleCancelTicket = async () => {
    try {
      await cancelTicket(id);
      setShowCancelModal(false);
      // Refresh ticket data setelah cancel
      getGroupedTicketById(id);
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setShowCancelModal(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setPaymentLoading(true);
      const paymentResult = await createPaymentToken(id);
      
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
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-with-navbar">
          <Alert />
        </div>
        <main className="main-content bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-with-navbar">
          <Alert />
        </div>
        <main className="main-content bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
            <Link to="/my-tickets" className="text-pink-600 hover:underline">
              &larr; Kembali ke daftar tiket
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show loading if ticket is not yet loaded
  if (!ticket) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-with-navbar">
          <Alert />
        </div>
        <main className="main-content bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Safely extract data using helper functions
  const orderData = getOrderData(ticket);
  const ticketsData = getTicketsData(ticket);
  const routeData = getRouteData(ticket);
  const userData = getUserData(ticket);
  const paymentData = getPaymentData(ticket);
  
  // For grouped orders, use the first ticket's status, for individual tickets use ticket status
  const mainTicket = ticketsData.length > 0 ? ticketsData[0] : ticket;
  const status = formatStatus(mainTicket?.status_tiket || ticket?.status_tiket);

  // Check if we have minimum required data
  if (!routeData.asal || !routeData.tujuan) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-with-navbar">
          <Alert />
        </div>
        <main className="main-content bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg mb-4">
              Data tiket tidak lengkap. Silakan coba muat ulang halaman.
            </div>
            <Link to="/my-tickets" className="text-pink-600 hover:underline">
              &larr; Kembali ke daftar tiket
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-with-navbar">
        <Alert />
      </div>

      <main className="main-content bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <Link to="/my-tickets" className="text-pink-600 hover:underline text-sm sm:text-base">
                &larr; Kembali ke daftar tiket
              </Link>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2">Detail Tiket</h1>
            </div>
            <div className={`${status.colorClass} font-semibold px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm bg-opacity-20 text-center sm:text-left`}>
              {status.text}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Ticket Header */}
            <div className="p-4 sm:p-6 border-b">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    {routeData.asal || 'N/A'} - {routeData.tujuan || 'N/A'}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {routeData.nama_bus || routeData.Bus?.nama_bus || 'Bus Tidak Diketahui'}
                  </p>
                </div>
                <div className="lg:text-right">
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {orderData ? 'Nomor Pesanan' : 'Nomor Tiket'}
                  </p>
                  <p className="font-semibold text-sm sm:text-base">
                    {orderData ? orderData.order_group_id : `TB-${ticket.id_tiket}`}
                  </p>
                  {orderData && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      {orderData.total_tickets} tiket dalam pesanan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                <div>
                  <h3 className="font-bold mb-4 text-base sm:text-lg">Informasi Perjalanan</h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Tanggal</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {routeData.waktu_berangkat ?
                          formatDate(routeData.waktu_berangkat) :
                          'Tanggal tidak tersedia'
                        }
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Jam Berangkat</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {routeData.waktu_berangkat ?
                          formatTime(routeData.waktu_berangkat) :
                          'Waktu tidak tersedia'
                        }
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Terminal Asal</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {routeData.terminal_asal || `Terminal ${routeData.asal || 'N/A'}`}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Terminal Tujuan</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {routeData.terminal_tujuan || `Terminal ${routeData.tujuan || 'N/A'}`}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Nomor Kursi</div>
                      <div className="sm:w-2/3 font-semibold">
                        {orderData ? (
                          // Show seats from order data for grouped tickets
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {(Array.isArray(orderData.seats) ? orderData.seats : [orderData.seats]).map((seat, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs sm:text-sm font-medium"
                              >
                                {seat}
                              </span>
                            ))}
                          </div>
                        ) : Array.isArray(ticket.nomor_kursi) ? (
                          // Show seats from individual ticket data
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {ticket.nomor_kursi.map((seat, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs sm:text-sm font-medium"
                              >
                                {seat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm sm:text-base">{ticket.nomor_kursi || 'N/A'}</span>
                        )}
                        {(orderData?.total_tickets > 1 || ticket.ticket_count > 1) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {orderData?.total_tickets || ticket.ticket_count} kursi dalam 1 pemesanan
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Fasilitas</div>
                      <div className="sm:w-2/3">
                        {routeData.fasilitas ? (
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {routeData.fasilitas.split(',').map((item, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm"
                              >
                                {item.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm sm:text-base">Standar</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-4 text-base sm:text-lg">Informasi Penumpang & Pembayaran</h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Nama</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">{userData.username || 'N/A'}</div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Email</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base break-all">{userData.email || 'N/A'}</div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">No. Telepon</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">{userData.no_telepon || 'N/A'}</div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Metode Pembayaran</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {paymentData.metode || 'Belum dibayar'}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row border-b pb-3">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Waktu Pembayaran</div>
                      <div className="sm:w-2/3 font-semibold text-sm sm:text-base">
                        {paymentData.waktu_pembayaran ?
                          formatDate(paymentData.waktu_pembayaran) + ' ' + formatTime(paymentData.waktu_pembayaran) :
                          '-'
                        }
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-1/3 text-gray-600 text-sm sm:text-base font-medium sm:font-normal">Total Bayar</div>
                      <div className="sm:w-2/3 font-bold text-base sm:text-lg text-pink-600">
                        {formatCurrency(orderData?.total_amount || ticket.total_bayar || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 sm:pt-6 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                {mainTicket?.status_tiket === 'pending' && (
                  <button
                    onClick={handlePayNow}
                    disabled={paymentLoading}
                    className="w-full sm:w-auto px-4 py-2 sm:py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {paymentLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </div>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </button>
                )}

                {mainTicket?.status_tiket === 'confirmed' && (
                  <button
                    onClick={handlePrintTicket}
                    className="w-full sm:w-auto px-4 py-2 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm sm:text-base"
                  >
                    Cetak Tiket
                  </button>
                )}
              </div>
            </div>

            {/* Important Notes */}
            <div className="mx-4 sm:mx-6 mb-4 sm:mb-6 bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-yellow-800 mb-2 text-sm sm:text-base">
                <i className="fas fa-info-circle mr-2"></i>
                Penting:
              </h3>
              <ul className="list-disc pl-4 sm:pl-6 text-yellow-800 space-y-1 text-xs sm:text-sm">
                <li>Harap tiba di terminal minimal 30 menit sebelum keberangkatan.</li>
                <li>Tiket ini harus ditunjukkan kepada petugas sebelum naik bus.</li>
                <li>Pembatalan tiket harus dilakukan minimal 30 menit sebelum keberangkatan.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Ticket Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 mx-4">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Batalkan Tiket</h2>
            <p className="mb-6 text-gray-700 text-sm sm:text-base">
              Apakah Anda yakin ingin membatalkan {orderData ? 'pesanan' : 'tiket'} ini? 
              {orderData && `Semua ${orderData.total_tickets} tiket dalam pesanan akan dibatalkan. `}
              Pembatalan tidak dapat dibatalkan.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
              >
                Batal
              </button>
              <button
                onClick={handleCancelTicket}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm sm:text-base"
              >
                Ya, Batalkan Tiket
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

TicketDetailPage.propTypes = {
  getGroupedTicketById: PropTypes.func.isRequired,
  cancelTicket: PropTypes.func.isRequired,
  createPaymentToken: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  ticket: state.tiket.selectedTicket,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { 
  getGroupedTicketById, 
  cancelTicket, 
  createPaymentToken, 
  setAlert 
})(TicketDetailPage);