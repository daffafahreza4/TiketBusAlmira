import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

const NotificationWidget = ({ notifications = [], loading = false }) => {
  // Placeholder untuk notifikasi
  const defaultNotifications = [
    {
      id: 1,
      type: 'info',
      message: 'Selamat datang di dashboard Almira Travel!',
      link: null,
      date: new Date()
    },
    {
      id: 2,
      type: 'promo',
      message: 'Promo spesial akhir pekan! Diskon 20% untuk semua rute.',
      link: '/promo',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Kemarin
    },
    {
      id: 3,
      type: 'reminder',
      message: 'Jangan lupa cetak tiket Anda sebelum berangkat.',
      link: '/my-tickets',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 hari lalu
    }
  ];

  // Gunakan notifications dari props atau default jika kosong
  const notifList = notifications && notifications.length > 0 ? notifications : defaultNotifications;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Notifikasi</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-md"></div>
          <div className="h-16 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Notifikasi</h3>
        {notifList.length > 0 && (
          <Link to="/notifications" className="text-sm text-blue-600 hover:underline">
            Lihat Semua
          </Link>
        )}
      </div>
      
      {notifList.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-bell-slash"></i>
          </div>
          <p className="text-gray-600">Tidak ada notifikasi baru</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifList.map(notification => {
            // Determine icon based on notification type
            let icon, colorClass;
            switch (notification.type) {
              case 'info':
                icon = 'fas fa-info-circle';
                colorClass = 'text-blue-500';
                break;
              case 'promo':
                icon = 'fas fa-tags';
                colorClass = 'text-green-500';
                break;
              case 'reminder':
                icon = 'fas fa-clock';
                colorClass = 'text-yellow-500';
                break;
              case 'warning':
                icon = 'fas fa-exclamation-triangle';
                colorClass = 'text-red-500';
                break;
              default:
                icon = 'fas fa-bell';
                colorClass = 'text-gray-500';
            }
            
            // Format date as relative time (today, yesterday, or actual date)
            const today = new Date();
            const notifDate = new Date(notification.date);
            let dateDisplay;
            
            if (
              today.getDate() === notifDate.getDate() &&
              today.getMonth() === notifDate.getMonth() &&
              today.getFullYear() === notifDate.getFullYear()
            ) {
              dateDisplay = 'Hari ini';
            } else if (
              today.getDate() - notifDate.getDate() === 1 &&
              today.getMonth() === notifDate.getMonth() &&
              today.getFullYear() === notifDate.getFullYear()
            ) {
              dateDisplay = 'Kemarin';
            } else {
              dateDisplay = formatDate(notifDate);
            }
            
            return (
              <div 
                key={notification.id} 
                className="flex items-start p-3 rounded-md hover:bg-gray-50"
              >
                <div className={`mr-3 mt-1 ${colorClass}`}>
                  <i className={icon}></i>
                </div>
                <div className="flex-1">
                  <p className="mb-1">{notification.message}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{dateDisplay}</span>
                    {notification.link && (
                      <Link to={notification.link} className="text-xs text-blue-600 hover:underline">
                        Lihat Detail
                      </Link>
                    )}
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

NotificationWidget.propTypes = {
  notifications: PropTypes.array,
  loading: PropTypes.bool
};

NotificationWidget.defaultProps = {
  notifications: [],
  loading: false
};

export default NotificationWidget;