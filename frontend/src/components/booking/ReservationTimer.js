import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const ReservationTimer = ({
  expiryTime,
  onExpired,
  showWarning = true,
  redirectOnExpiry = true,
  redirectPath = '/search-results'
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const navigate = useNavigate();

  // Calculate time remaining
  const calculateTimeLeft = useCallback(() => {
    if (!expiryTime) return 0;

    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const difference = expiry - now;

    return Math.max(0, difference);
  }, [expiryTime]);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        setShowExpiredModal(true);

        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    // Initial calculation
    const remaining = calculateTimeLeft();
    setTimeLeft(remaining);

    if (remaining <= 0) {
      setIsExpired(true);
      setShowExpiredModal(true);

      if (onExpired) {
        onExpired();
      }
    }

    return () => clearInterval(timer);
  }, [calculateTimeLeft, isExpired, onExpired]);

  // Format time display
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = () => {
    const minutes = Math.floor(timeLeft / 60000);

    if (minutes <= 2) return 'text-red-600 bg-red-50 border-red-200';
    if (minutes <= 10) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  // Get warning message
  const getWarningMessage = () => {
    const minutes = Math.floor(timeLeft / 60000);

    if (minutes <= 2) {
      return 'Waktu reservasi hampir habis! Segera selesaikan pembayaran.';
    }
    if (minutes <= 10) {
      return 'Perhatian: Waktu reservasi Anda tinggal sedikit.';
    }
    return null;
  };

  // Handle modal close and redirect
  const handleExpiredModalClose = () => {
    setShowExpiredModal(false);

    if (redirectOnExpiry) {
      navigate(redirectPath);
    }
  };

  // Don't render if no expiry time
  if (!expiryTime) {
    return null;
  }

  return (
    <>
      {/* Timer Display */}
      <div className={`p-4 rounded-lg border-2 ${getTimerColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">
              {isExpired ? '⏰' : '⏳'}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {isExpired ? 'Reservasi Berakhir' : 'Sisa Waktu Reservasi'}
              </p>
              <p className="text-2xl font-bold font-mono">
                {isExpired ? '00:00' : formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {!isExpired && (
            <div className="text-right">
              <p className="text-xs opacity-75">Berakhir pada</p>
              <p className="text-sm font-semibold">
                {new Date(expiryTime).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {!isExpired && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.max(0, Math.min(100, (timeLeft / 1800000) * 100))}%`,
                  backgroundColor: timeLeft <= 300000 ? '#dc2626' : timeLeft <= 900000 ? '#d97706' : '#16a34a'
                }}
              />
            </div>
          </div>
        )}

        {/* Warning message */}
        {showWarning && !isExpired && getWarningMessage() && (
          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            {getWarningMessage()}
          </div>
        )}
      </div>

      {/* Expired Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="text-6xl mb-4">⏰</div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Waktu Reservasi Habis
            </h2>

            <p className="text-gray-600 mb-6">
              Maaf, waktu reservasi kursi Anda telah berakhir.
              Kursi yang Anda pilih sekarang tersedia untuk penumpang lain.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExpiredModalClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Pilih Kursi Lagi
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ReservationTimer.propTypes = {
  expiryTime: PropTypes.string.isRequired,
  onExpired: PropTypes.func,
  showWarning: PropTypes.bool,
  redirectOnExpiry: PropTypes.bool,
  redirectPath: PropTypes.string
};

export default ReservationTimer;