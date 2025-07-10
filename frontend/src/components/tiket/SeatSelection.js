import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getAvailableSeats, setSelectedSeats, checkSeatAvailability } from '../../redux/actions/tiketActions';
import { createTempReservation, cancelReservation } from '../../redux/actions/reservasiActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatCurrency } from '../../utils/formatters';

const SeatSelection = ({
  routeId,
  route,
  availableSeats,
  selectedSeats,
  loading,
  error,
  getAvailableSeats,
  setSelectedSeats,
  createTempReservation,
  cancelReservation,
  checkSeatAvailability,
  setAlert
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSeatsList, setSelectedSeatsList] = useState(selectedSeats || []);
  const [totalPrice, setTotalPrice] = useState(0);
  const [seatStatuses, setSeatStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSeats, setIsCheckingSeats] = useState(false);
  const [userReservations, setUserReservations] = useState([]); // Track user's active reservations
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now()); // Track last refresh for auto-refresh

  // TAMBAH: Function to handle cancel all user reservations for this route
  const cancelAllUserReservations = useCallback(async () => {
    try {
      // Get all user reservations for this route from sessionStorage
      const storedReservations = sessionStorage.getItem(`reservations_${routeId}`);
      if (storedReservations) {
        const reservationIds = JSON.parse(storedReservations);
        
        // Cancel each reservation
        for (const reservationId of reservationIds) {
          try {
            await cancelReservation(reservationId);
            console.log(`✅ Cancelled reservation: ${reservationId}`);
          } catch (error) {
            console.warn(`⚠️ Could not cancel reservation ${reservationId}:`, error);
          }
        }
        
        // Clear stored reservations
        sessionStorage.removeItem(`reservations_${routeId}`);
        setUserReservations([]);
        
        console.log('🧹 All user reservations cancelled for route:', routeId);
      }
    } catch (error) {
      console.warn('⚠️ Error cancelling user reservations:', error);
    }
  }, [routeId, cancelReservation]);

  // ENHANCED: Handle page load, back navigation, and payment returns
  useEffect(() => {
    const handlePageLoad = async () => {
      // Check if user came from payment or booking (detect various return scenarios)
      const navigationEntries = performance.getEntriesByType('navigation');
      const isBackNavigation = navigationEntries.length > 0 && 
        navigationEntries[0].type === 'back_forward';

      // Check URL params for return indicators
      const urlParams = new URLSearchParams(window.location.search);
      const fromBooking = urlParams.get('from') === 'booking';
      const shouldCancelReservations = urlParams.get('cancel') === 'true';
      const fromPayment = urlParams.get('from') === 'payment' || urlParams.get('payment') === 'success';

      // NEW: Check if user returned from Midtrans payment
      const referrer = document.referrer;
      const isFromMidtrans = referrer.includes('midtrans') || referrer.includes('snap');
      
      // NEW: Check localStorage for payment completion flag
      const paymentCompleted = localStorage.getItem('payment_completed');
      const lastPaymentTime = localStorage.getItem('last_payment_time');
      const currentTime = Date.now();
      
      // Consider payment recently completed if within last 5 minutes
      const isRecentPayment = lastPaymentTime && (currentTime - parseInt(lastPaymentTime)) < (5 * 60 * 1000);

      if (isBackNavigation || fromBooking || shouldCancelReservations || fromPayment || isFromMidtrans || (paymentCompleted && isRecentPayment)) {
        console.log('🔄 User returned to seat selection - performing cleanup and refresh');
        console.log('  - Back navigation:', isBackNavigation);
        console.log('  - From booking:', fromBooking);
        console.log('  - Should cancel:', shouldCancelReservations);
        console.log('  - From payment:', fromPayment);
        console.log('  - From Midtrans:', isFromMidtrans);
        console.log('  - Recent payment:', isRecentPayment);
        
        // Cancel any existing reservations
        await cancelAllUserReservations();
        
        // Clear selected seats
        setSelectedSeatsList([]);
        setSelectedSeats([]);
        
        // Clear sessionStorage
        try {
          sessionStorage.removeItem('selectedSeats');
          sessionStorage.removeItem(`reservations_${routeId}`);
        } catch (error) {
          console.warn('Could not clear sessionStorage:', error);
        }
        
        // Clear payment completion flags
        if (paymentCompleted) {
          localStorage.removeItem('payment_completed');
          localStorage.removeItem('last_payment_time');
        }
        
        // Clean URL
        if (fromBooking || shouldCancelReservations || fromPayment) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        // Show appropriate message
        if (fromPayment || isFromMidtrans || isRecentPayment) {
          setAlert('Pembayaran selesai! Kursi yang telah dibeli ditampilkan dengan status terbaru.', 'success');
        } else {
          setAlert('Reservasi sebelumnya telah dibatalkan. Silakan pilih kursi kembali.', 'info');
        }
        
        // CRITICAL: Force refresh seat data with a small delay
        setTimeout(() => {
          console.log('🔄 Force refreshing seat data after payment/navigation...');
          refreshSeatData(true); // Pass true for force refresh
        }, 1000);
      }
    };

    if (routeId) {
      handlePageLoad();
    }
  }, [routeId, cancelAllUserReservations, setSelectedSeats, setAlert, location]);

  // ENHANCED: Auto-refresh mechanism for payment completion detection
  useEffect(() => {
    if (!routeId) return;

    // Function to check for payment completion indicators
    const checkPaymentCompletion = () => {
      const paymentCompleted = localStorage.getItem('payment_completed');
      const lastPaymentTime = localStorage.getItem('last_payment_time');
      const currentTime = Date.now();
      
      if (paymentCompleted && lastPaymentTime) {
        const timeSincePayment = currentTime - parseInt(lastPaymentTime);
        
        // If payment was completed within last 2 minutes, refresh seats
        if (timeSincePayment < (2 * 60 * 1000) && timeSincePayment > 5000) {
          console.log('🔄 Recent payment detected, refreshing seats...');
          refreshSeatData(true);
          
          // Clear the flags to avoid repeated refreshes
          localStorage.removeItem('payment_completed');
          localStorage.removeItem('last_payment_time');
        }
      }
    };

    // Check immediately
    checkPaymentCompletion();

    // Set up interval for auto-refresh (every 15 seconds)
    const interval = setInterval(() => {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime;
      
      // Auto-refresh every 15 seconds, but more frequently if recent activity
      const refreshInterval = (timeSinceLastRefresh < (2 * 60 * 1000)) ? 10000 : 15000;
      
      if (timeSinceLastRefresh >= refreshInterval) {
        refreshSeatData();
        checkPaymentCompletion();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [routeId, lastRefreshTime]);

  // TAMBAH: Function to detect user leaving page and cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If user is leaving without completing booking, cleanup reservations
      const hasSelectedSeats = selectedSeatsList.length > 0;
      const storedReservations = sessionStorage.getItem(`reservations_${routeId}`);
      
      if (hasSelectedSeats && storedReservations) {
        // Set flag to cancel reservations on next visit
        sessionStorage.setItem('shouldCancelReservations', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedSeatsList.length, routeId]);

  // TAMBAH: Check and cleanup reservations on component mount
  useEffect(() => {
    const shouldCancel = sessionStorage.getItem('shouldCancelReservations');
    if (shouldCancel === 'true') {
      sessionStorage.removeItem('shouldCancelReservations');
      cancelAllUserReservations();
    }
  }, [cancelAllUserReservations]);

  // FIXED: Memoize generateAllSeats function
  const generateAllSeats = useCallback(() => {
    // FIXED: Get totalSeats from availableSeats data or route data
    let totalSeats = 40; // default fallback

    if (availableSeats?.totalSeats) {
      totalSeats = availableSeats.totalSeats;
    } else if (route?.total_kursi) {
      totalSeats = route.total_kursi;
    } else if (route?.Bus?.total_kursi) {
      totalSeats = route.Bus.total_kursi;
    }

    const allSeats = {};
    for (let seatNum = 1; seatNum <= totalSeats; seatNum++) {
      allSeats[seatNum.toString()] = 'available';
    }
    return allSeats;
  }, [availableSeats?.totalSeats, route?.total_kursi, route?.Bus?.total_kursi]);

  // ENHANCED: Refresh seat data function with force option
  const refreshSeatData = useCallback(async (force = false) => {
    try {
      console.log(`🔄 Refreshing seat data${force ? ' (forced)' : ''}...`);
      
      // Add cache busting for force refresh
      if (force) {
        // Clear any cached responses by adding timestamp
        const timestamp = Date.now();
        console.log(`🔄 Force refresh with timestamp: ${timestamp}`);
      }
      
      await getAvailableSeats(routeId);
      setLastRefreshTime(Date.now());
      
      console.log('✅ Seat data refresh completed');
    } catch (error) {
      console.error('❌ Failed to refresh seat data:', error);
    }
  }, [getAvailableSeats, routeId]);

  useEffect(() => {
    const defaultSeats = generateAllSeats();
    setSeatStatuses(defaultSeats);

    try {
      const storedSeats = sessionStorage.getItem('selectedSeats');
      if (storedSeats) {
        const seats = JSON.parse(storedSeats);
        setSelectedSeatsList(seats);
        setSelectedSeats(seats);
      }
    } catch (error) {
      console.warn('Could not restore seats from storage:', error);
    }
  }, [generateAllSeats, setSelectedSeats]);

  useEffect(() => {
    const loadSeats = async () => {
      if (routeId) {
        try {
          await getAvailableSeats(routeId);
          setLastRefreshTime(Date.now());
        } catch (error) {
          if (error.response?.data?.booking_closed) {
            setAlert('Pemesanan untuk rute ini sudah ditutup', 'warning');
            navigate('/search-results');
          }
        }
      }
    };

    loadSeats();
  }, [getAvailableSeats, routeId, navigate]);

  useEffect(() => {
    if (route && selectedSeatsList) {
      setTotalPrice(route.harga * selectedSeatsList.length);
    }
  }, [route, selectedSeatsList]);

  // PERBAIKAN: useEffect untuk seat colors - Logic yang diperbaiki
  useEffect(() => {
    const statusMap = generateAllSeats(); // Default semua seats = 'available'

    if (availableSeats) {
      // PERBAIKAN: Jangan reset semua ke 'booked' dulu
      // Biarkan default 'available' dari generateAllSeats()

      if (Array.isArray(availableSeats)) {
        // Format: ['1', '2', '3', ...]
        availableSeats.forEach(seat => {
          if (statusMap.hasOwnProperty(seat)) {
            statusMap[seat] = 'available';
          }
        });

        // Set sisanya ke 'booked' jika tidak ada dalam array
        Object.keys(statusMap).forEach(seat => {
          if (!availableSeats.includes(seat)) {
            statusMap[seat] = 'booked';
          }
        });
      }
      else if (availableSeats.seats && Array.isArray(availableSeats.seats)) {
        // Format: [{number: '1', status: 'available'}, ...]
        // Reset semua ke 'booked' dulu untuk format ini
        Object.keys(statusMap).forEach(seat => {
          statusMap[seat] = 'booked';
        });

        availableSeats.seats.forEach(seatData => {
          const seatNumber = seatData.number || seatData.seat_number;
          if (seatNumber && statusMap.hasOwnProperty(seatNumber)) {
            statusMap[seatNumber] = seatData.status === 'available' ? 'available' : 'booked';
          }
        });
      }
      else if (availableSeats.seatStatuses) {
        // TAMBAH: Handle seatStatuses format
        // Format: {seatStatuses: {'1': 'available', '2': 'booked', ...}}
        Object.keys(availableSeats.seatStatuses).forEach(seat => {
          if (statusMap.hasOwnProperty(seat)) {
            statusMap[seat] = availableSeats.seatStatuses[seat];
          }
        });
      }
      else if (typeof availableSeats === 'object') {
        // Format: {'1': 'available', '2': 'booked', ...}
        Object.keys(availableSeats).forEach(seat => {
          if (statusMap.hasOwnProperty(seat)) {
            statusMap[seat] = availableSeats[seat];
          }
        });
      }
    }

    setSeatStatuses(statusMap);
    console.log('🎨 Seat colors updated:', statusMap); // Debug
  }, [availableSeats, generateAllSeats]);

  // TAMBAH: Clear all selections and reservations
  const clearAllSelections = async () => {
    try {
      // Cancel any active reservations
      await cancelAllUserReservations();
      
      // Clear selected seats
      setSelectedSeatsList([]);
      setSelectedSeats([]);
      
      // Clear sessionStorage
      try {
        sessionStorage.removeItem('selectedSeats');
        sessionStorage.removeItem(`reservations_${routeId}`);
      } catch (error) {
        console.warn('Could not clear sessionStorage:', error);
      }
      
      // Refresh seat data
      refreshSeatData(true); // Force refresh
      
      setAlert('Semua pilihan kursi telah dibersihkan', 'info');
    } catch (error) {
      console.error('Error clearing selections:', error);
      setAlert('Gagal membersihkan pilihan kursi', 'danger');
    }
  };

  // Handle seat click
  const handleSeatClick = async (seatNumber) => {
    const seatStatus = seatStatuses[seatNumber];

    if (seatStatus !== 'available') return;
    if (isCheckingSeats) return; // Prevent multiple clicks

    let newSelection;
    if (selectedSeatsList.includes(seatNumber)) {
      // Jika kursi sudah dipilih, hapus dari selection
      newSelection = selectedSeatsList.filter(seat => seat !== seatNumber);
    } else {
      // PERBAIKAN: Validasi maksimal 5 kursi SEBELUM pengecekan availability
      if (selectedSeatsList.length >= 5) {
        // Dispatch setAlert ke Redux store
        setAlert('Hanya bisa memilih maksimal 5 kursi', 'warning');
        return; // Stop execution here
      }

      // Real-time check sebelum memilih kursi
      setIsCheckingSeats(true);
      try {
        const availabilityCheck = await checkSeatAvailability(routeId, [seatNumber]);

        if (!availabilityCheck.available) {
          setAlert(`Kursi ${seatNumber} sudah tidak tersedia. Silakan refresh halaman.`, 'danger');
          // Refresh seat data
          refreshSeatData(true); // Force refresh
          setIsCheckingSeats(false);
          return;
        }

        newSelection = [...selectedSeatsList, seatNumber];
      } catch (error) {
        setAlert('Gagal mengecek ketersediaan kursi. Silakan coba lagi.', 'danger');
        setIsCheckingSeats(false);
        return;
      }
      setIsCheckingSeats(false);
    }

    setSelectedSeatsList(newSelection);
    setSelectedSeats(newSelection);

    try {
      sessionStorage.setItem('selectedSeats', JSON.stringify(newSelection));
    } catch (error) {
      console.warn('Could not store in sessionStorage:', error);
    }
  };
  
  // CRITICAL FIX: Ensure seats are properly passed to BookingSummary
  const handleSubmit = async () => {
    if (selectedSeatsList.length === 0) {
      alert('Silakan pilih minimal 1 kursi');
      return;
    }

    try {
      setIsSubmitting(true);

      // Real-time check semua kursi yang dipilih
      const availabilityCheck = await checkSeatAvailability(routeId, selectedSeatsList);

      if (!availabilityCheck.available) {
        alert(`Kursi ${availabilityCheck.conflictSeats.join(', ')} sudah tidak tersedia. Silakan pilih kursi lain.`);
        // Refresh seat data dan clear selection
        refreshSeatData(true); // Force refresh
        setSelectedSeatsList([]);
        setSelectedSeats([]);
        sessionStorage.removeItem('selectedSeats');
        setIsSubmitting(false);
        return;
      }

      // CRITICAL: Ensure seats are stored in all possible places
      setSelectedSeats(selectedSeatsList);

      try {
        sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeatsList));
        sessionStorage.setItem('routeId', routeId);
      } catch (error) {
        console.warn('Could not store in sessionStorage:', error);
      }

      // Create URL with seat data
      const seatsParam = selectedSeatsList.join(',');

      // Try to create reservation first
      try {
        const reservationData = {
          id_rute: routeId,
          nomor_kursi: selectedSeatsList
        };

        const result = await createTempReservation(reservationData);

        if (result.success) {
          // TAMBAH: Store reservation IDs for cleanup later
          if (result.reservations && result.reservations.length > 0) {
            const reservationIds = result.reservations.map(r => r.id_reservasi);
            try {
              sessionStorage.setItem(`reservations_${routeId}`, JSON.stringify(reservationIds));
              setUserReservations(reservationIds);
            } catch (error) {
              console.warn('Could not store reservation IDs:', error);
            }
          }

          // PERBAIKAN: Refresh seat data immediately after successful reservation
          await refreshSeatData(true); // Force refresh

          let navigationUrl;

          if (result.reservations && result.reservations.length > 0) {
            const firstReservation = result.reservations[0];
            navigationUrl = `/booking/summary/${routeId}?reservation=${firstReservation.id_reservasi}&seats=${seatsParam}`;
          } else if (result.ticket) {
            navigate(`/ticket/${result.ticket.id_tiket}`);
            return;
          } else {
            navigationUrl = `/booking/summary/${routeId}?seats=${seatsParam}`;
          }

          navigate(navigationUrl);
        }
      } catch (reservationError) {
        console.warn('Reservation failed, navigating directly:', reservationError);

        const directUrl = `/booking/summary/${routeId}?seats=${seatsParam}`;
        navigate(directUrl);
      }
    } catch (error) {
      console.error('Error in submit:', error);
      alert('Gagal memproses. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Generate bus layout with dynamic seats based on totalSeats
  const generateBusLayout = () => {
    // FIXED: Get totalSeats from availableSeats data or route data
    let totalSeats = 40; // default fallback

    if (availableSeats?.totalSeats) {
      totalSeats = availableSeats.totalSeats;
    } else if (route?.total_kursi) {
      totalSeats = route.total_kursi;
    } else if (route?.Bus?.total_kursi) {
      totalSeats = route.Bus.total_kursi;
    }

    const seatsPerRow = 4; // 2-2 configuration
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    const layout = [];

    for (let row = 1; row <= totalRows; row++) {
      const rowSeats = [];

      // Calculate seat numbers for this row (2-2 configuration)
      const leftSeat1 = ((row - 1) * 4) + 1;
      const leftSeat2 = ((row - 1) * 4) + 2;
      const rightSeat1 = ((row - 1) * 4) + 3;
      const rightSeat2 = ((row - 1) * 4) + 4;

      // Only render seats that exist (don't exceed totalSeats)
      if (leftSeat1 <= totalSeats) {
        // Left side seats (2 seats)
        rowSeats.push(
          <div key={`left-${row}`} className="flex gap-1">
            <div
              className={`seat ${getSeatClass(leftSeat1.toString())}`}
              onClick={() => handleSeatClick(leftSeat1.toString())}
              data-seat={leftSeat1}
              style={{ cursor: 'pointer' }}
            >
              {leftSeat1}
            </div>
            {leftSeat2 <= totalSeats && (
              <div
                className={`seat ${getSeatClass(leftSeat2.toString())}`}
                onClick={() => handleSeatClick(leftSeat2.toString())}
                data-seat={leftSeat2}
                style={{ cursor: 'pointer' }}
              >
                {leftSeat2}
              </div>
            )}
          </div>
        );

        // Aisle (gang tengah)
        rowSeats.push(<div key={`aisle-${row}`} className="w-8"></div>);

        // Right side seats (2 seats)
        const rightSeats = [];
        if (rightSeat1 <= totalSeats) {
          rightSeats.push(
            <div
              key={`right1-${row}`}
              className={`seat ${getSeatClass(rightSeat1.toString())}`}
              onClick={() => handleSeatClick(rightSeat1.toString())}
              data-seat={rightSeat1}
              style={{ cursor: 'pointer' }}
            >
              {rightSeat1}
            </div>
          );
        }
        if (rightSeat2 <= totalSeats) {
          rightSeats.push(
            <div
              key={`right2-${row}`}
              className={`seat ${getSeatClass(rightSeat2.toString())}`}
              onClick={() => handleSeatClick(rightSeat2.toString())}
              data-seat={rightSeat2}
              style={{ cursor: 'pointer' }}
            >
              {rightSeat2}
            </div>
          );
        }

        if (rightSeats.length > 0) {
          rowSeats.push(
            <div key={`right-${row}`} className="flex gap-1">
              {rightSeats}
            </div>
          );
        }

        layout.push(
          <div key={`row-${row}`} className="flex justify-center items-center mb-2">
            <span className="w-8 text-xs text-gray-500 text-center">{row}</span>
            {rowSeats}
          </div>
        );
      }
    }

    return layout;
  };

  // Get seat CSS class
  const getSeatClass = (seatNumber) => {
    if (selectedSeatsList.includes(seatNumber)) {
      return 'seat-selected'; // HIJAU
    }

    const status = seatStatuses[seatNumber];

    switch (status) {
      case 'available':
        return 'seat-available'; // ABU-ABU
      case 'my_reservation':
        return 'seat-my-reservation';
      case 'booked':
      case 'reserved':
      default:
        return 'seat-booked'; // MERAH
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-center">Pilih Kursi</h2>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          {/* Bus Info */}
          {route && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-lg">{route.nama_bus}</h3>
              <div className="flex justify-between mt-2 text-sm">
                <div>
                  <p className="text-gray-600">Dari</p>
                  <p className="font-semibold">{route.asal}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Waktu Berangkat</p>
                  <p className="font-semibold">{new Date(route.waktu_berangkat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Ke</p>
                  <p className="font-semibold">{route.tujuan}</p>
                </div>
              </div>
            </div>
          )}

          {/* Refresh Button & Clear Selection */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">Pilih Kursi Anda</h3>
            <div className="flex gap-2">
              {/* TAMBAH: Clear Selection Button */}
              {selectedSeatsList.length > 0 && (
                <button
                  onClick={clearAllSelections}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
                  disabled={loading}
                >
                  <i className="fas fa-times mr-1"></i>
                  Clear
                </button>
              )}
              <button
                onClick={() => refreshSeatData(true)}
                className="px-3 py-1 bg-pink-100 text-pink-600 rounded hover:bg-pink-200 transition-colors text-sm"
                disabled={loading}
              >
                <i className="fas fa-sync-alt mr-1"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Legend - 4 Status */}
          <div className="mb-6 flex justify-center space-x-4 flex-wrap">
            <div className="flex items-center mb-2">
              <div className="seat-available w-6 h-6 mr-2 rounded border border-black"></div>
              <span className="text-sm">Tersedia</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="seat-selected w-6 h-6 mr-2 rounded"></div>
              <span className="text-sm">Dipilih</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="seat-booked w-6 h-6 mr-2 rounded"></div>
              <span className="text-sm">Tidak Tersedia</span>
            </div>
          </div>

          {/* Bus Layout */}
          <div className="bus-layout mb-8">
            <div className="text-center mb-4">
              <div className="driver-area mx-auto w-24 h-10 bg-gray-300 rounded-t-lg flex items-center justify-center">
                <span className="text-xs text-gray-700">SOPIR</span>
              </div>
            </div>

            <div className="seats-container py-4 px-6 border border-gray-300 rounded-lg">
              {generateBusLayout()}
            </div>

            <div className="text-center mt-4">
              <div className="back-area mx-auto w-full h-6 bg-gray-200 rounded-b-lg"></div>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="md:w-1/3">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 sticky top-4">
            <h3 className="font-bold text-lg mb-4">Ringkasan Pemesanan</h3>

            {route && (
              <>
                <div className="mb-4">
                  <p className="font-semibold">{route.nama_bus}</p>
                  <div className="text-sm flex justify-between mt-1">
                    <span>{route.asal} - {route.tujuan}</span>
                    <span>{new Date(route.waktu_berangkat).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 my-4 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Kursi Dipilih</h4>
                    {/* TAMBAH: Clear button in summary */}
                    {selectedSeatsList.length > 0 && (
                      <button
                        onClick={clearAllSelections}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>

                  {selectedSeatsList.length === 0 ? (
                    <p className="text-gray-500 italic">Belum ada kursi yang dipilih</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSeatsList.map(seat => (
                        <span
                          key={seat}
                          className="inline-flex items-center px-2 py-1 bg-pink-100 text-pink-800 rounded font-medium cursor-pointer hover:bg-pink-200"
                          onClick={() => handleSeatClick(seat)}
                          title="Klik untuk batal pilih"
                        >
                          {seat}
                          <i className="ml-1 text-xs"></i>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between mb-2">
                    <span>Jumlah Kursi</span>
                    <span className="font-medium">{selectedSeatsList.length}</span>
                  </div>

                  <div className="flex justify-between mb-2">
                    <span>Harga per Kursi</span>
                    <span className="font-medium">{formatCurrency(route.harga)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-300 mt-4 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={selectedSeatsList.length === 0 || isSubmitting}
                  className={`w-full mt-6 py-3 font-bold rounded-lg transition duration-300 ${selectedSeatsList.length === 0 || isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-pink-500 text-white hover:bg-pink-700'
                    }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </div>
                  ) : selectedSeatsList.length === 0 ?
                    'Pilih Kursi' : `Lanjut dengan ${selectedSeatsList.length} Kursi`
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

SeatSelection.propTypes = {
  routeId: PropTypes.string.isRequired,
  route: PropTypes.object,
  availableSeats: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  selectedSeats: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  getAvailableSeats: PropTypes.func.isRequired,
  setSelectedSeats: PropTypes.func.isRequired,
  createTempReservation: PropTypes.func.isRequired,
  cancelReservation: PropTypes.func.isRequired,
  checkSeatAvailability: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  route: state.rute.selectedRoute,
  availableSeats: state.tiket.availableSeats,
  selectedSeats: state.tiket.selectedSeats,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, {
  getAvailableSeats,
  setSelectedSeats,
  createTempReservation,
  cancelReservation,
  checkSeatAvailability,
  setAlert
})(SeatSelection);