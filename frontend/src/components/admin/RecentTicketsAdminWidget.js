import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate, formatTime, formatCurrency, formatStatus } from '../../utils/formatters';

const RecentTicketsAdminWidget = ({ recentTickets = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Tiket Terbaru</h3>
        <Link to="/admin/tickets" className="text-sm text-blue-600 hover:underline">
          Lihat Semua
        </Link>
      </div>
      
      {!recentTickets || recentTickets.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-2"></i>
          <p className="text-gray-500">Belum ada tiket terbaru</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentTickets.map(ticket => {
            const status = formatStatus(ticket.status_tiket);
            return (
              <div key={ticket.id_tiket} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* ✅ PERBAIKAN: Akses data sesuai dengan include backend */}
                    <h4 className="font-semibold">{ticket.User?.username || 'Unknown User'}</h4>
                    <p className="text-gray-600 text-sm">
                      {ticket.Rute?.asal || 'N/A'} → {ticket.Rute?.tujuan || 'N/A'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {ticket.Rute?.waktu_berangkat ? formatDate(ticket.Rute.waktu_berangkat) : 'N/A'} • {ticket.Rute?.waktu_berangkat ? formatTime(ticket.Rute.waktu_berangkat) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(ticket.total_bayar || 0)}</p>
                    <span className={`${status.colorClass} text-xs px-2 py-1 rounded-full bg-opacity-20`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

RecentTicketsAdminWidget.propTypes = {
  recentTickets: PropTypes.array,
  loading: PropTypes.bool
};

export default RecentTicketsAdminWidget;