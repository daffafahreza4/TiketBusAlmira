import React from 'react';
import PropTypes from 'prop-types';

const UserStatsWidget = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const ticketStats = stats.tickets || {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Statistik Tiket</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Tiket</span>
          <span className="font-bold text-xl">{ticketStats.total}</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              <span>Pending</span>
            </div>
            <span className="font-semibold">{ticketStats.pending}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span>Dikonfirmasi</span>
            </div>
            <span className="font-semibold">{ticketStats.confirmed}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              <span>Selesai</span>
            </div>
            <span className="font-semibold">{ticketStats.completed}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              <span>Dibatalkan</span>
            </div>
            <span className="font-semibold">{ticketStats.cancelled}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

UserStatsWidget.propTypes = {
  stats: PropTypes.object.isRequired,
  loading: PropTypes.bool
};

export default UserStatsWidget;