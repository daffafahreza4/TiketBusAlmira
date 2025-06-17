import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [groupedTicketData, setGroupedTicketData] = useState(null);
  const [error, setError] = useState(null);

  // Extract parameters from URL
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
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
  }, [orderId, transactionStatus, checkPaymentStatus, setAlert]);

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

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="container mx-auto px-4 flex justify-center items-center">
            <div className="text-center">
              <Spinner />
              <p className="mt-4 text-gray-600">Mengecek status pembayaran...</p>
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
        <main className="flex-grow bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-red-500 mb-4">
                <i className="fas fa-exclamation-triangle text-4xl"></i>
              </div>
              <h2 className="text-xl font-bold mb-4">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  to="/my-tickets"
                  className="block w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition"
                >
                  Lihat Tiket Saya
                </Link>
                <Link
                  to="/"
                  className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
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
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            {/* Status Header */}
            <div className={`p-6 text-center bg-${statusInfo.color}-50 border-b`}>
              <div className={`text-${statusInfo.color}-500 mb-4`}>
                <i className={`fas fa-${statusInfo.icon} text-5xl`}></i>
              </div>
              <h1 className={`text-2xl font-bold text-${statusInfo.color}-800 mb-2`}>
                Pembayaran {statusInfo.text}
              </h1>
              <p className="text-gray-600">
                Order ID: {orderId}
              </p>
            </div>

            {/* Payment Details */}
            {paymentData && (
              <div className="p-6">
                <h3 className="font-bold text-lg mb-4">Detail Pembayaran</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Pembayaran:</span>
                    <span className={`font-semibold text-${statusInfo.color}-600`}>
                      {paymentData.payment?.status || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode Pembayaran:</span>
                    <span className="font-semibold">
                      {paymentData.payment?.metode || 'Midtrans'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bayar:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(paymentData.ticket?.total_bayar || 0)}
                    </span>
                  </div>
                  
                  {paymentData.payment?.waktu_pembayaran && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu Pembayaran:</span>
                      <span className="font-semibold">
                        {new Date(paymentData.payment.waktu_pembayaran).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ticket Details */}
                {(groupedTicketData || paymentData.ticket) && (
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-lg mb-4">Detail Tiket</h3>
                    
                    {groupedTicketData && groupedTicketData.order ? (
                      // Show grouped order details
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nomor Pesanan:</span>
                          <span className="font-semibold">{groupedTicketData.order.order_group_id}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rute:</span>
                          <span className="font-semibold">
                            {groupedTicketData.route?.asal} → {groupedTicketData.route?.tujuan}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jumlah Tiket:</span>
                          <span className="font-semibold">
                            {groupedTicketData.order.total_tickets} tiket
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kursi:</span>
                          <span className="font-semibold">
                            {Array.isArray(groupedTicketData.order.seats) ? 
                              groupedTicketData.order.seats.join(', ') : 
                              groupedTicketData.order.seats
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status Tiket:</span>
                          <span className={`font-semibold ${
                            groupedTicketData.tickets?.[0]?.status_tiket === 'confirmed' ? 'text-green-600' : 
                            groupedTicketData.tickets?.[0]?.status_tiket === 'pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {groupedTicketData.tickets?.[0]?.status_tiket || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Show single ticket details (fallback)
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nomor Tiket:</span>
                          <span className="font-semibold">TB-{paymentData.ticket.id}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rute:</span>
                          <span className="font-semibold">
                            {paymentData.route?.asal} → {paymentData.route?.tujuan}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kursi:</span>
                          <span className="font-semibold">
                            {paymentData.ticket.nomor_kursi}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status Tiket:</span>
                          <span className={`font-semibold ${
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
                <div className="border-t pt-6 flex flex-col sm:flex-row gap-3">
                  {(groupedTicketData?.order?.master_ticket_id || paymentData?.ticket?.id) && (
                    <Link
                      to={`/ticket/${groupedTicketData?.order?.master_ticket_id || paymentData.ticket.id}`}
                      className="flex-1 px-4 py-3 bg-pink-500 text-white text-center rounded-lg hover:bg-pink-700 transition"
                    >
                      Lihat Detail Tiket
                    </Link>
                  )}
                  
                  <Link
                    to="/my-tickets"
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition"
                  >
                    Semua Tiket Saya
                  </Link>
                  
                  <Link
                    to="/"
                    className="flex-1 px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition"
                  >
                    Pesan Tiket Lagi
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