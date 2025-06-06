import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../../utils/formatters';

const AdminStatsWidget = ({ stats = {}, loading = false }) => {
  const statsData = [
    {
      name: 'Total Users',
      value: stats.totalUsers || 0,
      icon: 'fas fa-users',
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      name: 'Total Bus',
      value: stats.totalBuses || 0,
      icon: 'fas fa-bus',
      color: 'green',
      bgColor: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      name: 'Rute Aktif',
      value: stats.totalActiveRoutes || 0,
      icon: 'fas fa-route',
      color: 'yellow',
      bgColor: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center">
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <i className={`${stat.icon} text-white text-xl`}></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

AdminStatsWidget.propTypes = {
  stats: PropTypes.object.isRequired,
  loading: PropTypes.bool
};

export default AdminStatsWidget;