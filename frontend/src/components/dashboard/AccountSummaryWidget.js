import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatters';

const AccountSummaryWidget = ({ user, tickets = [], loading = false }) => {
  // Calculate statistics
  const getStats = () => {
    if (!tickets || tickets.length === 0) {
      return {
        totalTickets: 0,
        confirmedTickets: 0,
        cancelledTickets: 0,
        totalSpent: 0
      };
    }

    return {
      totalTickets: tickets.length,
      confirmedTickets: tickets.filter(t => t.status_tiket === 'confirmed' || t.status_tiket === 'completed').length,
      cancelledTickets: tickets.filter(t => t.status_tiket === 'cancelled').length,
      totalSpent: tickets
        .filter(t => t.status_tiket !== 'cancelled' && t.status_tiket !== 'pending')
        .reduce((sum, ticket) => sum + parseFloat(ticket.total_bayar), 0)
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Ringkasan Akun</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-bold mb-4">Ringkasan Akun</h3>
      
      <div className="flex items-center mb-6">
        <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mr-4">
          {user && user.username ? user.username.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h4 className="font-bold text-xl">{user ? user.username : 'User'}</h4>
          <p className="text-gray-600">{user ? user.email : 'user@example.com'}</p>
          <p className="text-sm mt-1">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Terverifikasi
            </span>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-500 text-sm">Total Tiket</p>
          <p className="font-bold text-2xl">{stats.totalTickets}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-500 text-sm">Tiket Dikonfirmasi</p>
          <p className="font-bold text-2xl">{stats.confirmedTickets}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-500 text-sm">Tiket Dibatalkan</p>
          <p className="font-bold text-2xl">{stats.cancelledTickets}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-500 text-sm">Total Pengeluaran</p>
          <p className="font-bold text-2xl">{formatCurrency(stats.totalSpent)}</p>
        </div>
      </div>
    </div>
  );
};

AccountSummaryWidget.propTypes = {
  user: PropTypes.object,
  tickets: PropTypes.array.isRequired,
  loading: PropTypes.bool
};

AccountSummaryWidget.defaultProps = {
  tickets: [],
  loading: false
};

export default AccountSummaryWidget;