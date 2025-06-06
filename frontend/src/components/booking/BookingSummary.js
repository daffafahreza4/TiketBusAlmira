import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import ReservationTimer from './ReservationTimer';
import { getBookingSummary} from '../../redux/actions/reservasiActions';
import { createBookingFromReservation } from '../../redux/actions/bookingActions';
import { getRouteById } from '../../redux/actions/ruteActions';
import { setAlert } from '../../redux/actions/alertActions';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

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
  setAlert
}) => {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reservationId = searchParams.get('reservation');
  
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

  // Helper function to extract seats - FIXED: Memoized to prevent re-renders
  const extractSeatsFromSources = useCallback(() => {
    console.log('🔍 [BookingSummary] Extracting seats from all sources...');
    
    // Source 1: URL parameters (most immediate)
    const urlSeats = searchParams.get('seats');
    if (urlSeats) {
      const seats = urlSeats.split(',').map(s => s.trim()).filter(s => s);
      console.log('✅ Found seats in URL:', seats);
      return seats;
    }
    
    // Source 2: Redux selectedSeats
    if (selectedSeats && selectedSeats.length > 0) {
      console.log('✅ Found seats in Redux:', selectedSeats);
      return [...selectedSeats];
    }
    
    // Source 3: SessionStorage backup
    try {
      const storedSeats = sessionStorage.getItem('selectedSeats');
      if (storedSeats) {
        const seats = JSON.parse(storedSeats);
        console.log('✅ Found seats in sessionStorage:', seats);
        return seats;
      }
    } catch (error) {
      console.warn('⚠️ Could not read from sessionStorage:', error);
    }
    
    // Source 4: From summaryData/reservation
    if (summaryData?.nomor_kursi) {
      const seats = Array.isArray(summaryData.nomor_kursi) ? 
        summaryData.nomor_kursi : [summaryData.nomor_kursi];
      console.log('✅ Found seats in summaryData:', seats);
      return seats;
    }
    
    if (reservation?.nomor_kursi) {
      const seats = Array.isArray(reservation.nomor_kursi) ? 
        reservation.nomor_kursi : [reservation.nomor_kursi];
      console.log('✅ Found seats in reservation:', seats);
      return seats;
    }
    
    console.log('❌ No seats found from any source');
    return [];
  }, [searchParams, selectedSeats, summaryData, reservation]);

  // FIXED: Load initial data only once
  useEffect(() => {
    if (isDataLoaded) return; // Prevent re-loading
    
    const loadData = async () => {
      console.log('🔍 [BookingSummary] Loading initial data:', { routeId, reservationId });
      
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
      console.log('🔍 [BookingSummary] Updating final seats:', extractedSeats);
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
      console.log('✅ [BookingSummary] Created comprehensive summary:', newSummaryData);
      setSummaryData(newSummaryData);
    }
  }, [selectedRoute, finalSeats, reservation, user, routeId, summaryData]);

  // FIXED: Check for missing seats and redirect only once
  useEffect(() => {
    if (!isDataLoaded) return; // Wait for data to load
    if (finalSeats.length > 0) return; // We have seats, no need to redirect
    if (reservationId && reservationId !== 'temp') return; // Has reservation, might have seats in API
    
    console.log('⚠️ [BookingSummary] No seats found and no reservation, redirecting to booking');
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

      console.log('🔍 [BookingSummary] Creating booking:', bookingData);

      const result = await createBookingFromReservation(bookingData);
      
      if (result && result.success) {
        // Handle successful booking
        if (result.tickets && result.tickets.length > 0) {
          // Multiple tickets created
          navigate(`/ticket/${result.tickets[0].id_tiket}`);
        } else if (result.ticket && result.ticket.id_tiket) {
          // Single ticket created
          navigate(`/ticket/${result.ticket.id_tiket}`);
        } else if (result.id_tiket) {
          // Direct ticket ID
          navigate(`/ticket/${result.id_tiket}`);
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
            navigate(`/booking/${routeId}`);
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
    console.log('⏰ [BookingSummary] Reservation expired');
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

  // Calculate values
  const basePrice = summaryData?.route?.harga || selectedRoute?.harga || 0;
  const adminFee = 5000;
  const seatCount = finalSeats.length;
  const totalPrice = (basePrice * seatCount) + adminFee;
  
  const timeRemaining = summaryData?.waktu_expired ? 
    new Date(summaryData.waktu_expired) - new Date() : 0;
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  return (
    <div className="max-w-4xl mx-auto">
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
                  onClick={() => navigate(`/booking/${routeId}`)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Informasi Penumpang</h2>
            
            <form onSubmit={onSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama"
                    value={nama}
                    onChange={onChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                    disabled={submitting}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nomor Telepon</label>
                <input
                  type="text"
                  name="noTelepon"
                  value={noTelepon}
                  onChange={onChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                  disabled={submitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Nomor telepon akan digunakan untuk konfirmasi perjalanan
                </p>
              </div>
              
              <div className="mb-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={agreeTerms}
                    onChange={onChange}
                    className="mr-2 mt-1"
                    required
                    disabled={submitting}
                  />
                  <span className="text-sm">
                    Saya setuju dengan{' '}
                    <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                      Syarat dan Ketentuan
                    </a>{' '}
                    serta{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                      Kebijakan Privasi
                    </a>. Saya memahami bahwa reservasi ini akan berakhir dalam waktu yang ditentukan.
                  </span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={!agreeTerms || submitting || seatCount === 0 || seatConflictError}
                className={`w-full py-3 font-bold rounded-lg transition duration-300 ${
                  !agreeTerms || submitting || seatCount === 0 || seatConflictError
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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
                  'Konfirmasi Pemesanan'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
            <h2 className="text-xl font-bold mb-4">Ringkasan Reservasi</h2>
            
            {/* Trip Info */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold text-lg mb-2">
                {summaryData?.bus?.nama_bus || selectedRoute?.nama_bus || 'Bus'}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rute:</span>
                  <span className="font-medium">
                    {summaryData?.route?.asal || selectedRoute?.asal || 'N/A'} → {summaryData?.route?.tujuan || selectedRoute?.tujuan || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">
                    {summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat ? 
                      formatDate(summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium">
                    {summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat ? 
                      formatTime(summaryData?.route?.waktu_berangkat || selectedRoute?.waktu_berangkat) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Seat Info - CRITICAL FIX */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-2">Detail Kursi</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {seatCount > 0 ? (
                  finalSeats.map((seat, index) => (
                    <span 
                      key={index}
                      className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                        seatConflictError && seatConflictError.conflictSeats.includes(seat)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {seat}
                      {seatConflictError && seatConflictError.conflictSeats.includes(seat) && (
                        <i className="fas fa-exclamation-triangle ml-1"></i>
                      )}
                    </span>
                  ))
                ) : (
                  <div className="w-full">
                    <span className="text-red-500 text-sm font-medium">⚠️ Tidak ada kursi dipilih</span>
                    <div className="mt-2">
                      <button
                        onClick={() => navigate(`/booking/${routeId}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Pilih kursi sekarang
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Kursi:</span>
                  <span className="font-medium">{seatCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Harga per Kursi:</span>
                  <span className="font-medium">
                    {formatCurrency(basePrice)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Pricing Breakdown */}
            <div className="border-b pb-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(basePrice * seatCount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Admin:</span>
                <span className="font-medium">{formatCurrency(adminFee)}</span>
              </div>
            </div>
            
            {/* Total */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                *Sudah termasuk pajak dan biaya layanan
              </p>
            </div>
            
            {/* Reservation Status */}
            <div className={`p-3 rounded-lg ${seatConflictError ? 'bg-red-50' : 'bg-blue-50'}`}>
              <div className={`flex items-center ${seatConflictError ? 'text-red-800' : 'text-blue-800'}`}>
                <i className={`${seatConflictError ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle'} mr-2`}></i>
                <span className="font-medium text-sm">
                  {seatConflictError ? 'Kursi Tidak Tersedia' : 'Status: Direservasi'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${seatConflictError ? 'text-red-600' : 'text-blue-600'}`}>
                {seatConflictError 
                  ? 'Kursi yang Anda pilih sudah tidak tersedia. Silakan pilih kursi lain.'
                  : 'Kursi Anda telah direservasi. Selesaikan pembayaran sebelum waktu habis.'
                }
              </p>
              {minutesRemaining > 0 && !seatConflictError && (
                <p className="text-xs text-blue-600 mt-1">
                  Sisa waktu: {minutesRemaining} menit
                </p>
              )}
            </div>
            
            {/* Debug Info - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p className="font-semibold mb-2">Debug Info:</p>
                <p>URL Seats: {searchParams.get('seats') || 'none'}</p>
                <p>Redux Seats: {JSON.stringify(selectedSeats)}</p>
                <p>Final Seats: {JSON.stringify(finalSeats)}</p>
                <p>Seat Count: {seatCount}</p>
                <p>Route ID: {routeId}</p>
                <p>Reservation ID: {reservationId || 'none'}</p>
                <p>Is Data Loaded: {isDataLoaded.toString()}</p>
                <p>Seat Conflict: {seatConflictError ? 'Yes' : 'No'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
  setAlert: PropTypes.func.isRequired
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
  setAlert
})(BookingSummary);