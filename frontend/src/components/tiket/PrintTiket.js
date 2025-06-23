import React, { useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import Spinner from '../layout/Spinner';
import { getGroupedTicketById } from '../../redux/actions/tiketActions';
import { formatDate, formatTime } from '../../utils/formatters';

const PrintTiket = ({ getGroupedTicketById, ticket, loading, error }) => {
  const { id } = useParams();
  const componentRef = useRef();
  
  useEffect(() => {
    if (id) {
      getGroupedTicketById(id);
    }
  }, [getGroupedTicketById, id]);

  // Helper functions to safely access nested data
  const getRouteData = (ticketData) => {
    // Handle grouped order structure
    if (ticketData?.route) {
      return ticketData.route;
    }
    // Fallback to individual ticket structure
    return ticketData?.rute || ticketData?.Rute || {};
  };

  const getUserData = (ticketData) => {
    return ticketData?.user || ticketData?.User || {};
  };

  const getBusData = (ticketData) => {
    const route = getRouteData(ticketData);
    return route?.bus || route?.Bus || { nama_bus: route?.nama_bus || 'Bus Tidak Diketahui' };
  };

  // Helper function to get order/ticket data
  const getOrderData = (ticketData) => {
    return ticketData?.order || null;
  };

  // Helper function to get tickets array for grouped orders
  const getTicketsData = (ticketData) => {
    return ticketData?.tickets || [];
  };
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Tiket_${id}`,
    onAfterPrint: () => console.log('Dokumen berhasil dicetak')
  });
  
  useEffect(() => {
    // Auto print when component loads and ticket data is available
    if (ticket && !loading) {
      // Small delay to ensure component is fully rendered
      console.log(ticket);
      
      const timer = setTimeout(() => {
        handlePrint();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [ticket, loading, handlePrint]);
  
  if (loading || !ticket) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <Spinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md text-center">
          {error}
        </div>
      </div>
    );
  }

  // Extract data safely
  const orderData = getOrderData(ticket);
  const ticketsData = getTicketsData(ticket);
  const routeData = getRouteData(ticket);
  const userData = getUserData(ticket);
  const busData = getBusData(ticket);
  
  // For grouped orders, use the first ticket's data, for individual tickets use ticket data
  const mainTicket = ticketsData.length > 0 ? ticketsData[0] : ticket;

  // Check if we have minimum required data
  if (!routeData.asal || !routeData.tujuan || !userData.username) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg max-w-md text-center">
          Data tiket tidak lengkap. Tidak dapat mencetak tiket.
        </div>
      </div>
    );
  }
  
  // Generate QR code data
  const qrData = JSON.stringify({
    id: orderData?.order_group_id || mainTicket?.id_tiket || ticket?.id_tiket || 'N/A',
    name: userData.username || 'N/A',
    route: `${routeData.asal || 'N/A'}-${routeData.tujuan || 'N/A'}`,
    date: routeData.waktu_berangkat || new Date(),
    seat: orderData?.seats || mainTicket?.nomor_kursi || ticket?.nomor_kursi || 'N/A',
    tickets: orderData?.total_tickets || 1
  });
  
  // Format date for barcode
  const barcodeDate = routeData.waktu_berangkat 
    ? new Date(routeData.waktu_berangkat).toISOString().split('T')[0].replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  // Create barcode data
  const barcodeData = `TB${mainTicket?.id_tiket || ticket?.id_tiket || '000'}${barcodeDate}`;
  
  return (
    <div className="relative">
      <div className="fixed top-4 right-4 print:hidden z-10">
        <button
          onClick={handlePrint}
          className="px-3 sm:px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition text-sm sm:text-base"
        >
          <i className="fas fa-print mr-1 sm:mr-2"></i>
          <span className="hidden sm:inline">Cetak</span>
          <span className="sm:hidden">Print</span>
        </button>
      </div>
      
      <div ref={componentRef} className="max-w-2xl mx-auto bg-white p-4 sm:p-6 lg:p-8 my-4 sm:my-8 print:my-0 print:p-0 print:max-w-none">
        {/* Ticket Header */}
        <div className="border-b-2 border-gray-200 pb-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold">Almira Tiket</h1>
            <p className="text-gray-600 text-sm sm:text-base">Almira Travel - Perjalanan Nyaman Anda</p>
          </div>
          <div className="text-center sm:text-right">
            <img 
              src="\assets\img\LogoAlmira.png" 
              alt="Logo" 
              className="h-8 sm:h-12 mx-auto sm:mx-0"
            />
          </div>
        </div>
        
        {/* Ticket Body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Informasi Perjalanan</h2>
            <div className="space-y-2 sm:space-y-0">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Nama Bus</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">{busData.nama_bus}</td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Rute</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">{routeData.asal} - {routeData.tujuan}</td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Tanggal</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base">
                      {routeData.waktu_berangkat ? formatDate(routeData.waktu_berangkat) : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Waktu Berangkat</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base">
                      {routeData.waktu_berangkat ? formatTime(routeData.waktu_berangkat) : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Nomor Kursi</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">
                      {orderData ? (
                        Array.isArray(orderData.seats) ? orderData.seats.join(', ') : (orderData.seats || 'N/A')
                      ) : (
                        Array.isArray(mainTicket?.nomor_kursi || ticket?.nomor_kursi) ? 
                          (mainTicket?.nomor_kursi || ticket?.nomor_kursi).join(', ') : 
                          (mainTicket?.nomor_kursi || ticket?.nomor_kursi || 'N/A')
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Informasi Penumpang</h2>
            <div className="space-y-2 sm:space-y-0">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Nama</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">{userData.username || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Email</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-all">{userData.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">No. Telepon</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">{userData.no_telepon || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">{orderData ? 'No. Pesanan' : 'No. Tiket'}</td>
                    <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base break-words">
                      {orderData ? orderData.order_group_id : `TB-${mainTicket?.id_tiket || ticket?.id_tiket || '000'}`}
                    </td>
                  </tr>
                  {orderData && (
                    <tr>
                      <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Jumlah Tiket</td>
                      <td className="py-1 sm:py-2 font-semibold text-sm sm:text-base">{orderData.total_tickets} tiket</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 sm:py-2 text-gray-600 text-sm sm:text-base">Status</td>
                    <td className={`py-1 sm:py-2 font-semibold text-sm sm:text-base ${
                      mainTicket?.status_tiket === 'confirmed' ? 'text-green-600' : 
                      mainTicket?.status_tiket === 'pending' ? 'text-yellow-600' : 
                      'text-gray-600'
                    }`}>
                      {mainTicket?.status_tiket === 'confirmed' ? 'Dikonfirmasi' : 
                       mainTicket?.status_tiket === 'pending' ? 'Menunggu Pembayaran' : 
                       mainTicket?.status_tiket || ticket?.status_tiket || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Ticket Footer */}
        <div className="text-center text-gray-600 text-xs sm:text-sm mb-4">
          <p className="mb-2 font-semibold">Penting:</p>
          <ul className="list-disc text-left pl-4 sm:pl-8 space-y-1 text-xs sm:text-sm leading-relaxed">
            <li>Harap tiba di terminal minimal 30 menit sebelum keberangkatan.</li>
            <li>Tiket ini harus ditunjukkan kepada petugas sebelum naik bus.</li>
            <li>Pembatalan tiket harus dilakukan minimal 24 jam sebelum keberangkatan.</li>
            <li>Bagasi yang diperbolehkan maksimal 20kg per penumpang.</li>
            <li>Untuk informasi lebih lanjut, hubungi customer service Almira di 0812-2549-6270.</li>
          </ul>
        </div>
        
        <div className="border-t border-gray-200 pt-3 sm:pt-4 text-center text-xs text-gray-500">
          <p>Tiket ini diterbitkan oleh Almira © {new Date().getFullYear()}</p>
          <p>www.Almira.com</p>
        </div>
      </div>
    </div>
  );
};

PrintTiket.propTypes = {
  getGroupedTicketById: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  ticket: state.tiket.selectedTicket,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { getGroupedTicketById })(PrintTiket);