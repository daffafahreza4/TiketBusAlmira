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
    onAfterPrint: () => console.log('Dokumen berhasil dicetak'),
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        .print-container {
          width: 100%;
          height: 100vh;
          padding: 0;
          margin: 0;
        }
      }
    `
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
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-700 transition text-base"
        >
          <i className="fas fa-print mr-2"></i>
          Cetak
        </button>
      </div>
      
      <div ref={componentRef} className="print-container bg-white" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '15mm', boxSizing: 'border-box' }}>
        
        {/* Ticket Header - A4 Optimized */}
        <div className="border-b-2 border-gray-300 pb-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Almira Tiket</h1>
          </div>
          <div>
            <img 
              src="\assets\img\LogoAlmira.png" 
              alt="Logo" 
              className="h-16"
            />
          </div>
        </div>
        
        {/* Ticket Body - A4 Layout */}
        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">Informasi Perjalanan</h2>
            <div className="space-y-0">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-3 text-gray-600 text-base font-medium">Nama Bus</td>
                    <td className="py-3 font-semibold text-base">{busData.nama_bus}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Rute</td>
                    <td className="py-3 font-semibold text-base">{routeData.asal} - {routeData.tujuan}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Tanggal</td>
                    <td className="py-3 font-semibold text-base">
                      {routeData.waktu_berangkat ? formatDate(routeData.waktu_berangkat) : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Waktu Berangkat</td>
                    <td className="py-3 font-semibold text-base">
                      {routeData.waktu_berangkat ? formatTime(routeData.waktu_berangkat) : 'N/A'}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Nomor Kursi</td>
                    <td className="py-3 font-semibold text-base">
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
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-200 pb-2">Informasi Penumpang</h2>
            <div className="space-y-0">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-3 text-gray-600 text-base font-medium">Nama</td>
                    <td className="py-3 font-semibold text-base">{userData.username || 'N/A'}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Email</td>
                    <td className="py-3 font-semibold text-base break-all">{userData.email || 'N/A'}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">No. Telepon</td>
                    <td className="py-3 font-semibold text-base">{userData.no_telepon || 'N/A'}</td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">{orderData ? 'No. Pesanan' : 'No. Tiket'}</td>
                    <td className="py-3 font-semibold text-base">
                      {orderData ? orderData.order_group_id : `TB-${mainTicket?.id_tiket || ticket?.id_tiket || '000'}`}
                    </td>
                  </tr>
                  {orderData && (
                    <tr className="border-t border-gray-100">
                      <td className="py-3 text-gray-600 text-base font-medium">Jumlah Tiket</td>
                      <td className="py-3 font-semibold text-base">{orderData.total_tickets} tiket</td>
                    </tr>
                  )}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 text-gray-600 text-base font-medium">Status</td>
                    <td className={`py-3 font-semibold text-base ${
                      mainTicket?.status_tiket === 'confirmed' ? 'text-green-600' : 
                      mainTicket?.status_tiket === 'pending' ? 'text-yellow-600' : 
                      'text-gray-600'
                    }`}>
                      {mainTicket?.status_tiket === 'confirmed' ? 'Dikonfirmasi' : 
                       mainTicket?.status_tiket === 'pending' ? 'Menunggu Pembayaran' : 
                       mainTicket?.status_tiket === 'completed' ? 'Selesai' :
                       mainTicket?.status_tiket || ticket?.status_tiket || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Important Notes - A4 Optimized */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">Informasi Penting</h3>
          <ul className="list-disc pl-6 text-yellow-800 space-y-2 text-base leading-relaxed">
            <li>Harap tiba di terminal sebelum keberangkatan bus.</li>
            <li>Tiket ini harus ditunjukkan kepada petugas sebelum naik bus.</li>
            <li>Untuk informasi lebih lanjut, hubungi customer service Almira di 0812-2549-6270.</li>
          </ul>
        </div>
        
        {/* Footer - A4 Optimized */}
        <div className="border-t border-gray-200 pt-6 text-center text-gray-500">
          <p className="text-base font-medium">Tiket ini diterbitkan oleh Almira Travel © {new Date().getFullYear()}</p>
          <p className="text-sm mt-2">almiratravel.site | Melayani dengan Sepenuh Hati</p>
          <p className="text-xs mt-4 text-gray-400">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
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