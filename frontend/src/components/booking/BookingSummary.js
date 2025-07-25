import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import ReservationTimer from './ReservationTimer';
import NavigationGuard from './NavigationGuard'; // TAMBAH: Import NavigationGuard
import { getBookingSummary } from '../../redux/actions/reservasiActions';
import { createBookingFromReservation } from '../../redux/actions/bookingActions';
import { getRouteById } from '../../redux/actions/ruteActions';
import { setAlert } from '../../redux/actions/alertActions';
import { createPaymentToken } from '../../redux/actions/paymentActions';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import useReservationCleanup from '../../hooks/useReservationCleanup'; // TAMBAH: Import custom hook

const BookingSummary = ({
  user,
  reservation,
  selectedRoute,
  selectedSeats,
  loading,
  error,
  getBookingSummary,
  createBookingFromReservation,
  getRouteById,
  setAlert,
  createPaymentToken
}) => {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get('reservation');

  // TAMBAH: Use custom cleanup hook
  const { 
    performCompleteCleanup, 
    hasStoredReservations,
    getStoredReservationIds 
  } = useReservationCleanup(routeId);

  const [formData, setFormData] = useState({
    nama: user ? user.username : '',
    email: user ? user.email : '',
    noTelepon: user ? user.no_telepon : '',
    agreeTerms: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [finalSeats, setFinalSeats] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [seatConflictError, setSeatConflictError] = useState(null);

  // TAMBAH: Handle navigation away from booking summary
  const handleBeforeLeave = useCallback(async () => {
    console.log('🚨 User leaving BookingSummary - performing cleanup');
    
    try {
      await performCompleteCleanup();
      
      // Navigate back to seat selection with cancel flag
      const targetUrl = `/booking/${routeId}?cancel=true&from=booking`;
      
      // Use setTimeout to ensure cleanup completes before navigation
      setTimeout(() => {
        navigate(targetUrl, { replace: true });
      }, 100);
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Still navigate even if cleanup fails
      navigate(`/booking/${routeId}?cancel=true&from=booking`, { replace: true });
    }
  }, [performCompleteCleanup, routeId, navigate]);

  // TAMBAH: Handle back to seat selection manually
  const handleBackToSeatSelection = useCallback(async () => {
    const confirmMessage = finalSeats.length > 0 
      ? `Anda akan kehilangan reservasi untuk ${finalSeats.length} kursi yang sudah dipilih. Lanjutkan?`
      : 'Kembali ke pemilihan kursi?';
      
    if (window.confirm(confirmMessage)) {
      await handleBeforeLeave();
    }
  }, [finalSeats.length, handleBeforeLeave]);

  // Helper function to extract seats - FIXED: Memoized to prevent re-renders
  const extractSeatsFromSources = useCallback(() => {
    // Source 1: URL parameters (most immediate)
    const urlSeats = searchParams.get('seats');
    if (urlSeats) {
      const seats = urlSeats.split(',').map(s => s.trim()).filter(s => s);
      return seats;
    }

    // Source 2: Redux selectedSeats
    if (selectedSeats && selectedSeats.length > 0) {
      return [...selectedSeats];
    }

    // Source 3: SessionStorage backup
    try {
      const storedSeats = sessionStorage.getItem('selectedSeats');
      if (storedSeats) {
        const seats = JSON.parse(storedSeats);
        return seats;
      }
    } catch (error) {
      console.warn('⚠️ Could not read from sessionStorage:', error);
    }

    // Source 4: From summaryData/reservation
    if (summaryData?.nomor_kursi) {
      const seats = Array.isArray(summaryData.nomor_kursi) ?
        summaryData.nomor_kursi : [summaryData.nomor_kursi];
      return seats;
    }

    if (reservation?.nomor_kursi) {
      const seats = Array.isArray(reservation.nomor_kursi) ?
        reservation.nomor_kursi : [reservation.nomor_kursi];
      return seats;
    }

    return [];
  }, [searchParams, selectedSeats, summaryData, reservation]);

  // FIXED: Load initial data only once
  useEffect(() => {
    if (isDataLoaded) return; // Prevent re-loading

    const loadData = async () => {
      try {
        // Load route data first
        if (routeId) {
          await getRouteById(routeId);
        }

        // Load reservation data if available
        if (reservationId && reservationId !== 'temp') {
          const summary = await getBookingSummary(reservationId);
          setSummaryData(summary);
        }

        setIsDataLoaded(true);
      } catch (err) {
        console.error('❌ [BookingSummary] Error loading data:', err);
        setIsDataLoaded(true); // Still mark as loaded to prevent infinite retries
      }
    };

    loadData();
  }, [routeId, reservationId, getRouteById, getBookingSummary, isDataLoaded]);

  // FIXED: Extract seats only when sources change, not when finalSeats changes
  useEffect(() => {
    const extractedSeats = extractSeatsFromSources();

    // Only update if seats actually changed
    if (JSON.stringify(extractedSeats) !== JSON.stringify(finalSeats)) {
      setFinalSeats(extractedSeats);

      // Store in sessionStorage as backup
      if (extractedSeats.length > 0) {
        try {
          sessionStorage.setItem('selectedSeats', JSON.stringify(extractedSeats));
        } catch (error) {
          console.warn('⚠️ Could not store in sessionStorage:', error);
        }
      }
    }
  }, [extractSeatsFromSources, finalSeats]);

  // FIXED: Create summary data only when necessary dependencies change
  useEffect(() => {
    if (!selectedRoute && !summaryData?.route) return;
    if (finalSeats.length === 0) return;

    const route = summaryData?.route || selectedRoute;
    const busName = route?.nama_bus || route?.Bus?.nama_bus || 'Bus';

    const newSummaryData = {
      id_reservasi: reservation?.id_reservasi || summaryData?.id_reservasi || 'temp',
      nomor_kursi: finalSeats,
      waktu_expired: reservation?.waktu_expired || summaryData?.waktu_expired || new Date(Date.now() + 30 * 60 * 1000),
      Rute: route,
      User: user,
      total_harga: route ? route.harga * finalSeats.length : 0,
      route: {
        id_rute: route?.id_rute || routeId,
        asal: route?.asal || 'N/A',
        tujuan: route?.tujuan || 'N/A',
        waktu_berangkat: route?.waktu_berangkat || new Date(),
        harga: route?.harga || 0
      },
      bus: {
        nama_bus: busName,
        total_kursi: route?.total_kursi || route?.Bus?.total_kursi || 40
      }
    };

    // Only update if there's a meaningful change
    if (!summaryData || JSON.stringify(summaryData.nomor_kursi) !== JSON.stringify(finalSeats)) {
      setSummaryData(newSummaryData);
    }
  }, [selectedRoute, finalSeats, reservation, user, routeId, summaryData]);

  // FIXED: Check for missing seats and redirect only once
  useEffect(() => {
    if (!isDataLoaded) return; // Wait for data to load
    if (finalSeats.length > 0) return; // We have seats, no need to redirect
    if (reservationId && reservationId !== 'temp') return; // Has reservation, might have seats in API

    navigate(`/booking/${routeId}`);
  }, [finalSeats, reservationId, routeId, navigate, isDataLoaded]);

  const { nama, email, noTelepon, agreeTerms } = formData;

  const onChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const onSubmit = async e => {
    e.preventDefault();

    if (!agreeTerms) {
      setAlert('Anda harus menyetujui syarat dan ketentuan', 'danger');
      return;
    }

    if (finalSeats.length === 0) {
      setAlert('Data kursi tidak ditemukan. Silakan pilih kursi terlebih dahulu.', 'danger');
      navigate(`/booking/${routeId}`);
      return;
    }

    // Clear any previous seat conflict errors
    setSeatConflictError(null);

    try {
      setSubmitting(true);

      const bookingData = {
        id_reservasi: summaryData?.id_reservasi || 'temp',
        id_rute: routeId,
        nomor_kursi: finalSeats,
        nama_penumpang: nama,
        email,
        no_telepon: noTelepon
      };

      const result = await createBookingFromReservation(bookingData);

      if (result && result.success) {
        // Get the ticket ID for payment
        let ticketId = null;
        if (result.tickets && result.tickets.length > 0) {
          ticketId = result.tickets[0].id_tiket;
        } else if (result.ticket && result.ticket.id_tiket) {
          ticketId = result.ticket.id_tiket;
        } else if (result.id_tiket) {
          ticketId = result.id_tiket;
        }

        if (ticketId) {
          // TAMBAH: Clear reservations after successful booking
          try {
            await performCompleteCleanup();
          } catch (cleanupError) {
            console.warn('Cleanup error after booking:', cleanupError);
          }

          // Create payment token and redirect to Midtrans
          try {
            const paymentResult = await createPaymentToken(ticketId);

            if (paymentResult.success && paymentResult.redirect_url) {
              // Redirect to Midtrans payment page
              window.location.href = paymentResult.redirect_url;
              return;
            } else {
              setAlert('Gagal membuat token pembayaran. Silakan coba lagi.', 'danger');
              navigate(`/ticket/${ticketId}`);
            }
          } catch (paymentError) {
            console.error('Payment token error:', paymentError);
            setAlert('Gagal membuat token pembayaran. Anda akan diarahkan ke halaman tiket.', 'warning');
            navigate(`/ticket/${ticketId}`);
          }
        } else {
          navigate('/my-tickets');
        }
      }
    } catch (error) {
      console.error('❌ [BookingSummary] Error creating booking:', error);

      // Handle specific seat conflict errors
      if (error.type === 'SEAT_CONFLICT' || error.status === 409) {
        setSeatConflictError({
          message: error.message,
          conflictSeats: error.conflictSeats || []
        });

        // Show option to select different seats
        setTimeout(() => {
          if (window.confirm('Kursi yang Anda pilih sudah tidak tersedia. Apakah Anda ingin memilih kursi lain?')) {
            handleBackToSeatSelection();
          }
        }, 1000);
      } else {
        setAlert('Gagal membuat booking. Silakan coba lagi.', 'danger');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReservationExpired = () => {
    setAlert('Waktu reservasi telah habis. Silakan pilih kursi kembali.', 'warning');
    navigate('/search-results');
  };

  // Show loading while data is being prepared
  if (loading || !isDataLoaded) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Memuat data reservasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2">Error</h3>
        <p>{error}</p>
        <button
          onClick={() => navigate('/search-results')}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Kembali ke Pencarian
        </button>
      </div>
    );
  }

  // Wait for route data before rendering
  if (!selectedRoute && !summaryData?.route) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Memuat data rute...</p>
        </div>
      </div>
    );
  }

  // Calculate values - MODIFIED: Removed admin fee
  const basePrice = summaryData?.route?.harga || selectedRoute?.harga || 0;
  const seatCount = finalSeats.length;
  const totalPrice = basePrice * seatCount; // REMOVED: adminFee

  const timeRemaining = summaryData?.waktu_expired ?
    new Date(summaryData.waktu_expired) - new Date() : 0;
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  return (
    <NavigationGuard
      onBeforeLeave={handleBeforeLeave}
      shouldWarn={finalSeats.length > 0}
      warningMessage={`Anda akan kehilangan reservasi untuk ${finalSeats.length} kursi yang sudah dipilih. Lanjutkan?`}
      routeId={routeId}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TAMBAH: Back to Seat Selection Button */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handleBackToSeatSelection}
            className="flex items-center text-pink-600 hover:text-pink-800 transition-colors"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            <span className="text-sm sm:text-base">Kembali ke Pemilihan Kursi</span>
          </button>
          
          {/* TAMBAH: Show active reservations indicator */}
          {hasStoredReservations && (
            <div className="text-xs sm:text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
              <i className="fas fa-clock mr-1"></i>
              Reservasi Aktif: {getStoredReservationIds().length}
            </div>
          )}
        </div>

        {/* Seat Conflict Error Alert */}
        {seatConflictError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Kursi Tidak Tersedia</h3>
                <div className="mt-2 text-sm">
                  <p>{seatConflictError.message}</p>
                  {seatConflictError.conflictSeats.length > 0 && (
                    <p className="mt-1">
                      Kursi yang bermasalah: {seatConflictError.conflictSeats.join(', ')}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleBackToSeatSelection}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Pilih Kursi Lain
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Timer */}
        {summaryData?.waktu_expired && !seatConflictError && (
          <div className="mb-6">
            <ReservationTimer
              expiryTime={summaryData.waktu_expired}
              onExpired={handleReservationExpired}
              showWarning={true}
              redirectOnExpiry={true}
              redirectPath="/search-results"
            />
          </div>
        )}

        {/* UNIFIED LAYOUT: Ringkasan di atas untuk semua device */}
        <div className="space-y-6">
          {/* 1. BOOKING SUMMARY - ALWAYS FIRST */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">Ringkasan Reservasi</h2>

            {/* Trip Info */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3">
                {summaryData?.bus?.nama_bus || selectedRoute?.nama_bus || 'Bus'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm sm:text-base">
                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Rute:</span>
                  <span className="font-medium sm:mt-1">
                    {summaryData?.route?.asal || selectedRoute?.asal || 'N/A'} → {summaryData?.route?.tujuan || selectedRoute?.tujuan || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium sm:mt-1">
                    {summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat ?
                      formatDate(summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat) : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between sm:flex-col">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium sm:mt-1">
                    {summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat ?
                      formatTime(summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-3 text-base sm:text-lg">Detail Order</h3>

              {/* Order Header */}
              {seatCount > 1 && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-ticket-alt text-pink-600 mr-2"></i>
                      <span className="font-medium text-pink-800 text-sm sm:text-base">
                        Order {seatCount} Tiket
                      </span>
                    </div>
                    <span className="text-pink-600 text-xs sm:text-sm font-medium">
                      Single Payment
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-pink-600 mt-1">
                    Satu pembayaran untuk semua tiket dalam order ini
                  </p>
                </div>
              )}

              {/* Seat Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-gray-600 text-sm sm:text-base">Kursi yang dipilih:</span>
                  <span className="text-sm sm:text-base font-medium">{seatCount} kursi</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {seatCount > 0 ? (
                    finalSeats.map((seat, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${seatConflictError && seatConflictError.conflictSeats.includes(seat)
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                          }`}
                      >
                        <i className="fas fa-check-circle mr-1"></i>
                        Kursi {seat}
                        {seatConflictError && seatConflictError.conflictSeats.includes(seat) && (
                          <i className="fas fa-exclamation-triangle ml-1"></i>
                        )}
                      </span>
                    ))
                  ) : (
                    <div className="w-full bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                        <span className="text-red-700 text-sm sm:text-base font-medium">Tidak ada kursi dipilih</span>
                      </div>
                      <button
                        onClick={handleBackToSeatSelection}
                        className="mt-2 text-pink-600 hover:text-pink-800 text-sm sm:text-base underline"
                      >
                        Pilih kursi sekarang →
                      </button>
                    </div>
                  )}
                </div>

                {/* Pricing Info */}
                <div className="mt-4 space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga per tiket:</span>
                    <span className="font-medium">{formatCurrency(basePrice)}</span>
                  </div>

                  {seatCount > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah tiket:</span>
                      <span className="font-medium">{seatCount} tiket</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown - MODIFIED: Removed admin fee section */}
            <div className="border-b pb-4 mb-4 space-y-2 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(basePrice * seatCount)}
                </span>
              </div>
              {/* REMOVED: Admin fee display */}
            </div>

            {/* Total */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between font-bold text-lg sm:text-xl lg:text-2xl">
                <span>Total:</span>
                <span className="text-pink-600">{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                *Sudah termasuk pajak
              </p>
            </div>

            {/* Reservation Status */}
            <div className={`p-3 sm:p-4 rounded-lg ${seatConflictError ? 'bg-red-50' : 'bg-blue-50'}`}>
              <div className={`flex items-center ${seatConflictError ? 'text-red-800' : 'text-pink-800'}`}>
                <i className={`${seatConflictError ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle'} mr-2`}></i>
                <span className="font-medium text-sm sm:text-base">
                  {seatConflictError ? 'Kursi Tidak Tersedia' : 'Status: Direservasi'}
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 ${seatConflictError ? 'text-red-600' : 'text-pink-600'}`}>
                {seatConflictError
                  ? 'Kursi yang Anda pilih sudah tidak tersedia. Silakan pilih kursi lain.'
                  : 'Kursi Anda telah direservasi. Selesaikan pembayaran sebelum waktu habis.'
                }
              </p>
              {minutesRemaining > 0 && !seatConflictError && (
                <p className="text-xs sm:text-sm text-pink-600 mt-1">
                  Sisa waktu: {minutesRemaining} menit
                </p>
              )}
            </div>
          </div>

          {/* 2. PASSENGER INFORMATION - ALWAYS SECOND - READONLY FIELDS */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">Informasi Penumpang</h2>

            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm sm:text-base">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama"
                    value={nama}
                    onChange={onChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base bg-gray-50 cursor-not-allowed"
                    required
                    disabled={submitting}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Data diambil dari profil akun Anda</p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm sm:text-base">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base bg-gray-50 cursor-not-allowed"
                    required
                    disabled={submitting}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Data diambil dari profil akun Anda</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium text-sm sm:text-base">Nomor Telepon</label>
                <input
                  type="text"
                  name="noTelepon"
                  value={noTelepon}
                  onChange={onChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base bg-gray-50 cursor-not-allowed"
                  required
                  disabled={submitting}
                  readOnly
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Data diambil dari profil akun Anda. <span className="text-pink-600 hover:underline cursor-pointer" onClick={() => window.open('/profile', '_blank')}>Edit profil</span> untuk mengubah.
                </p>
              </div>

              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={agreeTerms}
                    onChange={onChange}
                    className="mr-2 sm:mr-3 mt-1 w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    required
                    disabled={submitting}
                  />
                  <span className="text-xs sm:text-sm lg:text-base">
                    Saya setuju dengan syarat dan ketentuan serta kebijakan dari pihak Almira Travel. 
                    Saya memahami bahwa reservasi ini akan berakhir dalam waktu yang ditentukan.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!agreeTerms || submitting || seatCount === 0 || seatConflictError}
                className={`w-full py-3 sm:py-4 font-bold rounded-lg transition duration-300 text-sm sm:text-base lg:text-lg ${!agreeTerms || submitting || seatCount === 0 || seatConflictError
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-pink-500 text-white hover:bg-pink-700 shadow-lg hover:shadow-xl'
                  }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : seatConflictError ? (
                  'Pilih Kursi Lain'
                ) : seatCount === 0 ? (
                  'Tidak ada kursi dipilih'
                ) : (
                  'Konfirmasi & Bayar Sekarang'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </NavigationGuard>
  );
};

BookingSummary.propTypes = {
  user: PropTypes.object,
  reservation: PropTypes.object,
  selectedRoute: PropTypes.object,
  selectedSeats: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  getBookingSummary: PropTypes.func.isRequired,
  createBookingFromReservation: PropTypes.func.isRequired,
  getRouteById: PropTypes.func.isRequired,
  setAlert: PropTypes.func.isRequired,
  createPaymentToken: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  user: state.auth.user,
  reservation: state.reservasi.currentReservation,
  selectedRoute: state.rute.selectedRoute,
  selectedSeats: state.tiket.selectedSeats,
  loading: state.reservasi.loading || state.rute.loading,
  error: state.reservasi.error || state.rute.error
});

export default connect(mapStateToProps, {
  getBookingSummary,
  createBookingFromReservation,
  getRouteById,
  setAlert,
  createPaymentToken
})(BookingSummary);