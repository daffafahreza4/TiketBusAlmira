import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getAvailableSeats, setSelectedSeats, checkSeatAvailability } from '../../redux/actions/tiketActions';
import { createTempReservation } from '../../redux/actions/reservasiActions';
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
  checkSeatAvailability
}) => {
  const navigate = useNavigate();
  const [selectedSeatsList, setSelectedSeatsList] = useState(selectedSeats || []);
  const [totalPrice, setTotalPrice] = useState(0);
  const [seatStatuses, setSeatStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSeats, setIsCheckingSeats] = useState(false);

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

  // TAMBAHKAN function baru untuk refresh seat data
  const refreshSeatData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing seat data...');
      await getAvailableSeats(routeId);
    } catch (error) {
      console.error('Failed to refresh seat data:', error);
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

  // TAMBAHKAN auto-refresh
  useEffect(() => {
    if (!routeId) return;

    const interval = setInterval(() => {
      refreshSeatData();
    }, 15000); // Refresh setiap 15 detik

    return () => clearInterval(interval);
  }, [routeId, refreshSeatData]);

  // Handle seat click
  const handleSeatClick = async (seatNumber) => {
    const seatStatus = seatStatuses[seatNumber];

    if (seatStatus !== 'available') return;
    if (isCheckingSeats) return; // Prevent multiple clicks

    let newSelection;
    if (selectedSeatsList.includes(seatNumber)) {
      newSelection = selectedSeatsList.filter(seat => seat !== seatNumber);
    } else {
      // Real-time check sebelum memilih kursi
      setIsCheckingSeats(true);
      try {
        const availabilityCheck = await checkSeatAvailability(routeId, [seatNumber]);

        if (!availabilityCheck.available) {
          alert(`Kursi ${seatNumber} sudah tidak tersedia. Silakan refresh halaman.`);
          // Refresh seat data
          getAvailableSeats(routeId);
          setIsCheckingSeats(false);
          return;
        }

        newSelection = [...selectedSeatsList, seatNumber];
      } catch (error) {
        alert('Gagal mengecek ketersediaan kursi. Silakan coba lagi.');
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
        getAvailableSeats(routeId);
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
      case 'booked':
      case 'reserved':
      case 'my_reservation':
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

          {/* Refresh Button */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-bold text-lg">Pilih Kursi Anda</h3>
            <button
              onClick={refreshSeatData}
              className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-sm"
              disabled={loading}
            >
              <i className="fas fa-sync-alt mr-1"></i>
              Refresh
            </button>
          </div>

          {/* Legend - 3 Status Saja */}
          <div className="mb-6 flex justify-center space-x-6 flex-wrap">
            <div className="flex items-center mb-2">
              <div className="seat-available w-6 h-6 mr-2 rounded"></div>
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
                  <h4 className="font-semibold mb-2">Kursi Dipilih</h4>

                  {selectedSeatsList.length === 0 ? (
                    <p className="text-gray-500 italic">Belum ada kursi yang dipilih</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSeatsList.map(seat => (
                        <span
                          key={seat}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium"
                        >
                          {seat}
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
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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

                {/* Current Status */}
                {selectedSeatsList.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded text-sm">
                    <p className="font-semibold text-green-800">Status:</p>
                    <p className="text-green-700">
                      ✅ {selectedSeatsList.length} kursi dipilih: {selectedSeatsList.join(', ')}
                    </p>
                    <p className="text-green-700">
                      💰 Total: {formatCurrency(totalPrice)}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <p className="font-semibold mb-1">Debug Info:</p>
                    <p>Redux: {JSON.stringify(selectedSeats)}</p>
                    <p>Local: {JSON.stringify(selectedSeatsList)}</p>
                    <p>SessionStorage: {sessionStorage.getItem('selectedSeats') || 'none'}</p>
                  </div>
                )}
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
  checkSeatAvailability,
  setAlert
})(SeatSelection);