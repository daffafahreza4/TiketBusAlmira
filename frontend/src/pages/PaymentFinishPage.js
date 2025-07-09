import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { checkPaymentStatus } from '../redux/actions/paymentActions';
import { getGroupedTicketById } from '../redux/actions/tiketActions';
import { setAlert } from '../redux/actions/alertActions';
import { formatCurrency } from '../utils/formatters';

const PaymentFinishPage = ({
  checkPaymentStatus,
  setAlert,
  getGroupedTicketById
}) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [groupedTicketData, setGroupedTicketData] = useState(null);
  const [error, setError] = useState(null);

  // Extract parameters from URL
  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  useEffect(() => {
    const checkPayment = async () => {
      if (!orderId) {
        setError('Data pembayaran tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        // Extract ticket ID from order ID (format: ORDER-{id_tiket}-{timestamp})
        const ticketIdMatch = orderId.match(/ORDER-(\d+)-/);
        if (!ticketIdMatch) {
          setError('Format order ID tidak valid');
          setLoading(false);
          return;
        }

        const ticketId = ticketIdMatch[1];
        const result = await checkPaymentStatus(ticketId);
        
        if (result.success) {
          setPaymentData(result.data);
          
          // Also fetch grouped ticket data to show all tickets in the order
          try {
            const groupedResult = await getGroupedTicketById(ticketId);
            if (groupedResult) {
              setGroupedTicketData(groupedResult);
            }
          } catch (groupedErr) {
            console.warn('Could not fetch grouped ticket data:', groupedErr);
          }
          
          // Show appropriate message based on status
          if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
            setAlert('Pembayaran berhasil! Tiket Anda telah dikonfirmasi.', 'success');
            
            // PERBAIKAN: Clear session storage untuk selected seats setelah pembayaran berhasil
            try {
              sessionStorage.removeItem('selectedSeats');
              sessionStorage.removeItem('routeId');
            } catch (error) {
              console.warn('Could not clear session storage:', error);
            }
          } else if (transactionStatus === 'pending') {
            setAlert('Pembayaran sedang diproses. Silakan tunggu konfirmasi.', 'info');
          } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
            setAlert('Pembayaran gagal atau dibatalkan.', 'danger');
          }
        } else {
          setError('Gagal mengecek status pembayaran');
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
        setError('Terjadi kesalahan saat mengecek status pembayaran');
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [orderId, transactionStatus, checkPaymentStatus, setAlert, getGroupedTicketById]);

  const getStatusInfo = () => {
    if (!transactionStatus) return { color: 'gray', text: 'Unknown', icon: 'question-circle' };
    
    switch (transactionStatus) {
      case 'settlement':
      case 'capture':
        return { color: 'green', text: 'Berhasil', icon: 'check-circle' };
      case 'pending':
        return { color: 'yellow', text: 'Pending', icon: 'clock' };
      case 'deny':
        return { color: 'red', text: 'Ditolak', icon: 'times-circle' };
      case 'cancel':
        return { color: 'red', text: 'Dibatalkan', icon: 'times-circle' };
      case 'expire':
        return { color: 'red', text: 'Expired', icon: 'times-circle' };
      default:
        return { color: 'gray', text: transactionStatus, icon: 'info-circle' };
    }
  };

  const statusInfo = getStatusInfo();

  // Helper function to get background color based on status
  const getStatusBgColor = () => {
    switch (statusInfo.color) {
      case 'green': return 'bg-green-50';
      case 'yellow': return 'bg-yellow-50';
      case 'red': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  // Helper function to get text color based on status
  const getStatusTextColor = () => {
    switch (statusInfo.color) {
      case 'green': return 'text-green-800';
      case 'yellow': return 'text-yellow-800';
      case 'red': return 'text-red-800';
      default: return 'text-gray-800';
    }
  };

  // Helper function to get icon color based on status
  const getStatusIconColor = () => {
    switch (statusInfo.color) {
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-500';
      case 'red': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Helper function to get status value color
  const getStatusValueColor = () => {
    switch (statusInfo.color) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-100 py-4 sm:py-8">
          <div className="container mx-auto px-4 flex justify-center items-center">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray-600 text-sm sm:text-base">Mengecek status pembayaran...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Alert />
        <main className="flex-grow bg-gray-100 py-4 sm:py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
              <div className="text-red-500 mb-4">
                <i className="fas fa-exclamation-triangle text-3xl sm:text-4xl"></i>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4">Error</h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">{error}</p>
              <div className="space-y-3">
                <Link
                  to="/my-tickets"
                  className="block w-full px-4 py-2 sm:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition text-sm sm:text-base"
                >
                  Lihat Tiket Saya
                </Link>
                <Link
                  to="/"
                  className="block w-full px-4 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
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
      
      <main className="flex-grow bg-gray-100 py-4 sm:py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-sm sm:max-w-xl lg:max-w-2xl xl:max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            {/* Status Header */}
            <div className={`p-4 sm:p-6 lg:p-8 text-center ${getStatusBgColor()} border-b`}>
              <div className={`${getStatusIconColor()} mb-3 sm:mb-4`}>
                <i className={`fas fa-${statusInfo.icon} text-3xl sm:text-4xl lg:text-5xl`}></i>
              </div>
              <h1 className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${getStatusTextColor()} mb-2`}>
                Pembayaran {statusInfo.text}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base break-all">
                Order ID: {orderId}
              </p>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="p-4 sm:p-6 lg:p-8">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-4 sm:mb-6">Detail Pembayaran</h3>
                
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Status Pembayaran:</span>
                    <span className={`font-semibold text-sm sm:text-base ${getStatusValueColor()}`}>
                      {paymentData.payment?.status || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Metode Pembayaran:</span>
                    <span className="font-semibold text-sm sm:text-base">
                      {paymentData.payment?.metode || 'Midtrans'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Total Bayar:</span>
                    <span className="font-bold text-base sm:text-lg lg:text-xl text-pink-600">
                      {formatCurrency(paymentData.ticket?.total_bayar || 0)}
                    </span>
                  </div>
                  
                  {paymentData.payment?.waktu_pembayaran && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Waktu Pembayaran:</span>
                      <span className="font-semibold text-sm sm:text-base">
                        {new Date(paymentData.payment.waktu_pembayaran).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ticket Details */}
                {(groupedTicketData || paymentData.ticket) && (
                  <div className="border-t pt-4 sm:pt-6">
                    <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-4 sm:mb-6">Detail Tiket</h3>
                    
                    {groupedTicketData && groupedTicketData.order ? (
                      // Show grouped order details
                      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Nomor Pesanan:</span>
                          <span className="font-semibold text-sm sm:text-base break-all">
                            {groupedTicketData.order.order_group_id}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Rute:</span>
                          <span className="font-semibold text-sm sm:text-base">
                            {groupedTicketData.route?.asal} → {groupedTicketData.route?.tujuan}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Jumlah Tiket:</span>
                          <span className="font-semibold text-sm sm:text-base">
                            {groupedTicketData.order.total_tickets} tiket
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Kursi:</span>
                          <span className="font-semibold text-sm sm:text-base text-right">
                            {Array.isArray(groupedTicketData.order.seats) ? 
                              groupedTicketData.order.seats.join(', ') : 
                              groupedTicketData.order.seats
                            }
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Status Tiket:</span>
                          <span className={`font-semibold text-sm sm:text-base ${
                            groupedTicketData.tickets?.[0]?.status_tiket === 'confirmed' ? 'text-green-600' : 
                            groupedTicketData.tickets?.[0]?.status_tiket === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {groupedTicketData.tickets?.[0]?.status_tiket || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Show single ticket details (fallback)
                      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Nomor Tiket:</span>
                          <span className="font-semibold text-sm sm:text-base">TB-{paymentData.ticket.id}</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Rute:</span>
                          <span className="font-semibold text-sm sm:text-base">
                            {paymentData.route?.asal} → {paymentData.route?.tujuan}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Kursi:</span>
                          <span className="font-semibold text-sm sm:text-base">
                            {paymentData.ticket.nomor_kursi}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                          <span className="text-gray-600 text-sm sm:text-base">Status Tiket:</span>
                          <span className={`font-semibold text-sm sm:text-base ${
                            paymentData.ticket.status === 'confirmed' ? 'text-green-600' : 
                            paymentData.ticket.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {paymentData.ticket.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 sm:pt-6 space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3 lg:gap-4">
                  {(groupedTicketData?.order?.master_ticket_id || paymentData?.ticket?.id) && (
                    <Link
                      to={`/ticket/${groupedTicketData?.order?.master_ticket_id || paymentData.ticket.id}`}
                      className="block sm:flex-1 px-4 py-3 bg-pink-500 text-white text-center rounded-lg hover:bg-pink-700 transition duration-300 text-sm sm:text-base font-medium"
                    >
                      <i className="fas fa-ticket-alt mr-2 sm:mr-1"></i>
                      <span className="hidden sm:inline lg:hidden xl:inline">Lihat Detail Tiket</span>
                      <span className="sm:hidden lg:inline xl:hidden">Detail Tiket</span>
                    </Link>
                  )}
                  
                  <Link
                    to="/my-tickets"
                    className="block sm:flex-1 px-4 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition duration-300 text-sm sm:text-base font-medium"
                  >
                    <i className="fas fa-list mr-2 sm:mr-1"></i>
                    <span className="hidden sm:inline lg:hidden xl:inline">Semua Tiket Saya</span>
                    <span className="sm:hidden lg:inline xl:hidden">Tiket Saya</span>
                  </Link>
                  
                  <Link
                    to="/search-results"
                    className="block sm:flex-1 px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition duration-300 text-sm sm:text-base font-medium"
                  >
                    <i className="fas fa-plus mr-2 sm:mr-1"></i>
                    <span className="hidden sm:inline lg:hidden xl:inline">Pesan Tiket Lagi</span>
                    <span className="sm:hidden lg:inline xl:hidden">Pesan Lagi</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

PaymentFinishPage.propTypes = {
  checkPaymentStatus: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  getGroupedTicketById: PropTypes.func.isRequired
};

export default connect(null, {
  checkPaymentStatus,
  setAlert,
  getGroupedTicketById
})(PaymentFinishPage);