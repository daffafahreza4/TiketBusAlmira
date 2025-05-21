import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';

// Ubah definisi komponen untuk menggunakan parameter default
const PaymentStatusWidget = ({ tickets = [], loading = false }) => {
  // Filter untuk mendapatkan tiket pending payment
  const pendingPayments = tickets
    .filter(ticket => ticket.status_tiket === 'pending')
    .sort((a, b) => new Date(b.batas_pembayaran) - new Date(a.batas_pembayaran));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Status Pembayaran</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-bold mb-4">Status Pembayaran</h3>
      
      {pendingPayments.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-check-circle"></i>
          </div>
          <p className="text-gray-600">Tidak ada pembayaran yang tertunda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map(ticket => {
            const now = new Date();
            const deadline = new Date(ticket.batas_pembayaran);
            const hoursRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60));
            const isUrgent = hoursRemaining <= 4;
            
            return (
              <div 
                key={ticket.id_tiket} 
                className={`border rounded-md p-4 ${
                  isUrgent ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold">{ticket.rute.asal} - {ticket.rute.tujuan}</h4>
                    <p className="text-sm">{formatDate(ticket.rute.waktu_berangkat)}</p>
                    <div className="mt-2 font-semibold">
                      {formatCurrency(ticket.total_bayar)}
                    </div>
                  </div>
                  
                  <div className={`text-sm px-3 py-1 rounded-full ${
                    isUrgent 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isUrgent 
                      ? `${hoursRemaining} jam tersisa!` 
                      : `Batas: ${formatDate(ticket.batas_pembayaran)}`
                    }
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <Link
                    to={`/payment/${ticket.id_pembayaran}`}
                    className={`px-4 py-2 rounded-lg text-white font-medium text-sm ${
                      isUrgent ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
                    }`}
                  >
                    Bayar Sekarang
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

PaymentStatusWidget.propTypes = {
  tickets: PropTypes.array,
  loading: PropTypes.bool
};

// Hapus defaultProps
// PaymentStatusWidget.defaultProps = {
//   tickets: [],
//   loading: false
// };

export default PaymentStatusWidget;