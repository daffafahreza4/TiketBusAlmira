import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatters';

const RevenueWidget = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const revenue = stats.totalRevenue || 0;
  const totalUsers = stats.totalUsers || 0;
  const avgRevenuePerUser = totalUsers > 0 ? revenue / totalUsers : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold mb-4">Revenue Overview</h3>
      
      <div className="mb-6">
        <p className="text-gray-600 text-sm">Total Revenue</p>
        <p className="text-3xl font-bold text-green-600">{formatCurrency(revenue)}</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Revenue per User</span>
          <span className="font-semibold">{formatCurrency(avgRevenuePerUser)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Transaksi</span>
          <span className="font-semibold">{stats.tickets?.total || 0}</span>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center">
          <i className="fas fa-chart-line text-green-600 mr-2"></i>
          <span className="text-green-800 text-sm font-medium">
            Performa revenue stabil
          </span>
        </div>
      </div>
    </div>
  );
};

RevenueWidget.propTypes = {
  stats: PropTypes.object.isRequired,
  loading: PropTypes.bool
};

export default RevenueWidget;