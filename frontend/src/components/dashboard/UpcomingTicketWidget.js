import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters';

const UpcomingTicketsWidget = ({ tickets, loading }) => {
  // Filter untuk mendapatkan tiket yang akan datang
  // (tiket confirmed dengan tanggal keberangkatan > hari ini)
  const upcomingTickets = tickets
    .filter(ticket => {
      return (
        ticket.status_tiket === 'confirmed' &&
        new Date(ticket.rute.waktu_berangkat) > new Date()
      );
    })
    .sort((a, b) => new Date(a.rute.waktu_berangkat) - new Date(b.rute.waktu_berangkat))
    .slice(0, 3); // Ambil 3 tiket terdekat

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Tiket Mendatang</h3>
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
        <h3 className="text-lg font-bold">Tiket Mendatang</h3>
        <Link to="/my-tickets" className="text-sm text-blue-600 hover:underline">
          Lihat Semua
        </Link>
      </div>
      
      {upcomingTickets.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <p className="text-gray-600 mb-2">Tidak ada tiket mendatang</p>
          <Link to="/search-results" className="text-blue-600 hover:underline text-sm">
            Pesan tiket sekarang
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingTickets.map(ticket => {
            const status = formatStatus(ticket.status_tiket);
            const departureDate = new Date(ticket.rute.waktu_berangkat);
            const today = new Date();
            
            // Calculate days remaining
            const daysRemaining = Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24));
            
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
                    <p className="text-gray-500">Kursi</p>
                    <p className="font-medium">{ticket.nomor_kursi}</p>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-between items-center">
                  {daysRemaining > 0 ? (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {daysRemaining} hari lagi
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Hari ini
                    </span>
                  )}
                  
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

UpcomingTicketsWidget.propTypes = {
  tickets: PropTypes.array.isRequired,
  loading: PropTypes.bool
};

UpcomingTicketsWidget.defaultProps = {
  tickets: [],
  loading: false
};

export default UpcomingTicketsWidget;