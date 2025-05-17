import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../../utils/formatters';

const RecentTicketsWidget = ({ tickets, loading }) => {
  // Filter untuk mendapatkan riwayat tiket (completed atau cancelled)
  const recentTickets = tickets
    .filter(ticket => {
      return (
        ticket.status_tiket === 'completed' ||
        ticket.status_tiket === 'cancelled' ||
        (ticket.status_tiket === 'confirmed' && new Date(ticket.rute.waktu_berangkat) < new Date())
      );
    })
    .sort((a, b) => new Date(b.rute.waktu_berangkat) - new Date(a.rute.waktu_berangkat))
    .slice(0, 3); // Ambil 3 tiket terakhir

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Riwayat Tiket</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Riwayat Tiket</h3>
        <Link to="/my-tickets" className="text-sm text-blue-600 hover:underline">
          Lihat Semua
        </Link>
      </div>
      
      {recentTickets.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-history"></i>
          </div>
          <p className="text-gray-600">Tidak ada riwayat tiket</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentTickets.map(ticket => {
            const status = formatStatus(ticket.status_tiket);
            
            return (
              <div 
                key={ticket.id_tiket} 
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{ticket.rute.asal} - {ticket.rute.tujuan}</h4>
                    <p className="text-sm text-gray-600">{ticket.rute.nama_bus}</p>
                  </div>
                  <div className={`${status.colorClass} text-sm px-2 py-1 rounded-full h-fit bg-opacity-20`}>
                    {status.text}
                  </div>
                </div>
                
                <div className="flex justify-between mt-3 text-sm">
                  <div>
                    <p className="text-gray-500">Tanggal Berangkat</p>
                    <p className="font-medium">{formatDate(ticket.rute.waktu_berangkat)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Total Bayar</p>
                    <p className="font-medium">{formatCurrency(ticket.total_bayar)}</p>
                  </div>
                </div>
                
                <div className="mt-3 text-right">
                  <Link 
                    to={`/ticket/${ticket.id_tiket}`} 
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Detail <i className="fas fa-chevron-right text-xs ml-1"></i>
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

RecentTicketsWidget.propTypes = {
  tickets: PropTypes.array.isRequired,
  loading: PropTypes.bool
};

RecentTicketsWidget.defaultProps = {
  tickets: [],
  loading: false
};

export default RecentTicketsWidget;