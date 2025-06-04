import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';
import ReservationTimer from './ReservationTimer';
import { getBookingSummary} from '../../redux/actions/reservasiActions';
import { createBookingFromReservation } from '../../redux/actions/bookingActions';
import { getRouteById } from '../../redux/actions/ruteActions';
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
  getRouteById
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

  // FIXED: Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 [BookingSummary] Loading data:', { routeId, reservationId });
      
      try {
        // Always load route data
        if (routeId) {
          await getRouteById(routeId);
        }
        
        // Load reservation data if available
        if (reservationId) {
          const summary = await getBookingSummary(reservationId);
          setSummaryData(summary);
        }
      } catch (err) {
        console.error('❌ [BookingSummary] Error loading data:', err);
      }
    };

    loadData();
  }, [routeId, reservationId, getRouteById, getBookingSummary]);

  // FIXED: Create summary data from multiple sources
  useEffect(() => {
    console.log('🔍 [BookingSummary] State update:', {
      reservation,
      selectedRoute,
      selectedSeats,
      summaryData
    });

    // Create comprehensive summary from available data
    if (selectedRoute || reservation || summaryData) {
      const route = summaryData?.route || selectedRoute || reservation?.Rute;
      const seats = summaryData?.reservedSeats || selectedSeats || reservation?.nomor_kursi || [];
      const busName = route?.nama_bus || route?.Bus?.nama_bus || 'Bus';
      
      // Ensure seats is always an array
      const seatsArray = Array.isArray(seats) ? seats : [seats].filter(Boolean);
      
      const newSummaryData = {
        id_reservasi: reservation?.id_reservasi || summaryData?.id_reservasi || 'temp',
        nomor_kursi: seatsArray,
        waktu_expired: reservation?.waktu_expired || summaryData?.waktu_expired || new Date(Date.now() + 60 * 60 * 1000),
        Rute: route,
        User: user,
        total_harga: route ? route.harga * seatsArray.length : 0,
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
      
      console.log('✅ [BookingSummary] Summary data created:', newSummaryData);
      setSummaryData(newSummaryData);
    }
  }, [reservation, selectedRoute, selectedSeats, user, routeId]);

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
      alert('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    if (!summaryData) {
      alert('Data reservasi tidak ditemukan');
      return;
    }

    try {
      setSubmitting(true);
      
      const bookingData = {
        id_reservasi: summaryData.id_reservasi,
        id_rute: routeId,
        nomor_kursi: summaryData.nomor_kursi,
        nama_penumpang: nama,
        email,
        no_telepon: noTelepon
      };

      console.log('🔍 [BookingSummary] Creating booking:', bookingData);

      const result = await createBookingFromReservation(bookingData);
      
      if (result && result.id_tiket) {
        // Redirect to ticket detail page
        navigate(`/ticket/${result.id_tiket}`);
      } else {
        // Fallback navigation
        navigate('/my-tickets');
      }
    } catch (error) {
      console.error('❌ [BookingSummary] Error creating booking:', error);
      alert('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReservationExpired = () => {
    console.log('⏰ [BookingSummary] Reservation expired');
    // Will be redirected by ReservationTimer component
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
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

  // FIXED: Show loading while data is being prepared
  if (!summaryData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-gray-600">Memuat data reservasi...</p>
        </div>
      </div>
    );
  }

  // Calculate time remaining for timer
  const timeRemaining = summaryData.waktu_expired ? 
    new Date(summaryData.waktu_expired) - new Date() : 0;
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  // Calculate fees and total
  const basePrice = summaryData.route?.harga || 0;
  const adminFee = 5000; // Admin fee
  const totalPrice = (basePrice * (summaryData.nomor_kursi?.length || 1)) + adminFee;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Reservation Timer */}
      {summaryData.waktu_expired && (
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
                disabled={!agreeTerms || submitting}
                className={`w-full py-3 font-bold rounded-lg transition duration-300 ${
                  !agreeTerms || submitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
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
                {summaryData.bus?.nama_bus || 'Bus'}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rute:</span>
                  <span className="font-medium">
                    {summaryData.route?.asal || 'N/A'} → {summaryData.route?.tujuan || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">
                    {summaryData.route?.waktu_berangkat ? 
                      formatDate(summaryData.route.waktu_berangkat) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium">
                    {summaryData.route?.waktu_berangkat ? 
                      formatTime(summaryData.route.waktu_berangkat) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Seat Info */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-semibold mb-2">Detail Kursi</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {summaryData.nomor_kursi && summaryData.nomor_kursi.length > 0 ? (
                  summaryData.nomor_kursi.map((seat, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {seat}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">Tidak ada kursi dipilih</span>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Kursi:</span>
                  <span className="font-medium">{summaryData.nomor_kursi?.length || 0}</span>
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
                  {formatCurrency(basePrice * (summaryData.nomor_kursi?.length || 1))}
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center text-blue-800">
                <i className="fas fa-info-circle mr-2"></i>
                <span className="font-medium text-sm">Status: Direservasi</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Kursi Anda telah direservasi. Selesaikan pembayaran sebelum waktu habis.
              </p>
              {minutesRemaining > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Sisa waktu: {minutesRemaining} menit
                </p>
              )}
            </div>
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
  getRouteById: PropTypes.func.isRequired
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
  getRouteById
})(BookingSummary);