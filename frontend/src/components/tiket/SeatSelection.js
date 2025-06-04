import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getAvailableSeats, setSelectedSeats } from '../../redux/actions/tiketActions';
import { createTempReservation } from '../../redux/actions/reservasiActions';
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
  createTempReservation 
}) => {
  const navigate = useNavigate();
  const [selectedSeatsList, setSelectedSeatsList] = useState(selectedSeats || []);
  const [totalPrice, setTotalPrice] = useState(0);
  const [seatStatuses, setSeatStatuses] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate all possible seats (1A-10D = 40 seats)
  const generateAllSeats = () => {
    const allSeats = {};
    for (let row = 1; row <= 10; row++) {
      ['A', 'B', 'C', 'D'].forEach(col => {
        const seatNumber = `${row}${col}`;
        allSeats[seatNumber] = 'available'; // Default: all seats available
      });
    }
    return allSeats;
  };

  // Initialize seats on component mount
  useEffect(() => {
    const defaultSeats = generateAllSeats();
    setSeatStatuses(defaultSeats);
  }, []);

  // Fetch available seats when component mounts
  useEffect(() => {
    if (routeId) {
      getAvailableSeats(routeId);
    }
  }, [getAvailableSeats, routeId]);

  // Update total price when seats selected
  useEffect(() => {
    if (route && selectedSeatsList) {
      setTotalPrice(route.harga * selectedSeatsList.length);
    }
  }, [route, selectedSeatsList]);

  // Process seat data from backend
  useEffect(() => {
    // Start with all seats available
    const statusMap = generateAllSeats();
    
    if (availableSeats) {
      // Case 1: Array of available seat numbers ['1A', '1B', '2A', ...]
      if (Array.isArray(availableSeats)) {
        // Mark all seats as booked first
        Object.keys(statusMap).forEach(seat => {
          statusMap[seat] = 'booked';
        });
        
        // Then mark available seats
        availableSeats.forEach(seat => {
          if (statusMap.hasOwnProperty(seat)) {
            statusMap[seat] = 'available';
          }
        });
      } 
      // Case 2: Object with seats array
      else if (availableSeats.seats && Array.isArray(availableSeats.seats)) {
        availableSeats.seats.forEach(seatData => {
          if (seatData.seat_number) {
            let status = seatData.status || 'available';
            // Simplify: reserved and my_reservation become 'booked'
            if (status === 'reserved' || status === 'my_reservation') {
              status = 'booked';
            }
            statusMap[seatData.seat_number] = status;
          }
        });
      }
      // Case 3: Object with direct seat mapping
      else if (typeof availableSeats === 'object') {
        Object.keys(availableSeats).forEach(seat => {
          let status = availableSeats[seat];
          if (status === 'reserved' || status === 'my_reservation') {
            status = 'booked';
          }
          statusMap[seat] = status;
        });
      }
    }
    
    setSeatStatuses(statusMap);
  }, [availableSeats]);

  // Handle seat click
  const handleSeatClick = (seatNumber) => {
    const seatStatus = seatStatuses[seatNumber];
    
    // Only allow clicking available seats
    if (seatStatus !== 'available') {
      return;
    }

    if (selectedSeatsList.includes(seatNumber)) {
      // Remove seat from selection
      const newSelection = selectedSeatsList.filter(seat => seat !== seatNumber);
      setSelectedSeatsList(newSelection);
    } else {
      // Add seat to selection
      const newSelection = [...selectedSeatsList, seatNumber];
      setSelectedSeatsList(newSelection);
    }
  };

  // FIXED: Handle submit with proper data structure
  const handleSubmit = async () => {
    if (selectedSeatsList.length === 0) {
      alert('Silakan pilih minimal 1 kursi');
      return;
    }

    try {
      setIsSubmitting(true);
      setSelectedSeats(selectedSeatsList);

      const reservationData = {
        id_rute: routeId,
        nomor_kursi: selectedSeatsList
      };

      console.log('🔍 [SeatSelection] Creating reservation with:', reservationData);
      
      const result = await createTempReservation(reservationData);
      
      console.log('✅ [SeatSelection] Reservation result:', result);

      if (result.success) {
        // FIXED: Navigate with proper route structure
        if (result.reservations && result.reservations.length > 0) {
          // Case 1: Multiple reservations created
          const firstReservation = result.reservations[0];
          navigate(`/booking/summary/${routeId}?reservation=${firstReservation.id_reservasi}`);
        } else if (result.ticket) {
          // Case 2: Direct ticket created
          navigate(`/ticket/${result.ticket.id_tiket}`);
        } else {
          // Case 3: Simple navigation
          navigate(`/booking/summary/${routeId}`);
        }
      }
    } catch (error) {
      console.error('❌ [SeatSelection] Error creating reservation:', error);
      alert('Gagal membuat reservasi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        <h3 className="font-bold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Generate bus layout
  const generateBusLayout = () => {
    const rows = 10;
    const layout = [];

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      
      // Left side seats (A & B)
      rowSeats.push(
        <div key={`${row}A`} className="flex gap-1">
          <div 
            className={`seat ${getSeatClass(`${row}A`)}`}
            onClick={() => handleSeatClick(`${row}A`)}
            data-seat={`${row}A`}
            style={{ cursor: 'pointer' }}
          >
            {row}A
          </div>
          <div 
            className={`seat ${getSeatClass(`${row}B`)}`}
            onClick={() => handleSeatClick(`${row}B`)}
            data-seat={`${row}B`}
            style={{ cursor: 'pointer' }}
          >
            {row}B
          </div>
        </div>
      );
      
      // Aisle
      rowSeats.push(
        <div key={`aisle-${row}`} className="w-8"></div>
      );
      
      // Right side seats (C & D)
      rowSeats.push(
        <div key={`${row}C`} className="flex gap-1">
          <div 
            className={`seat ${getSeatClass(`${row}C`)}`}
            onClick={() => handleSeatClick(`${row}C`)}
            data-seat={`${row}C`}
            style={{ cursor: 'pointer' }}
          >
            {row}C
          </div>
          <div 
            className={`seat ${getSeatClass(`${row}D`)}`}
            onClick={() => handleSeatClick(`${row}D`)}
            data-seat={`${row}D`}
            style={{ cursor: 'pointer' }}
          >
            {row}D
          </div>
        </div>
      );
      
      layout.push(
        <div key={`row-${row}`} className="flex justify-center items-center mb-2">
          {rowSeats}
        </div>
      );
    }

    return layout;
  };

  // Get seat CSS class
  const getSeatClass = (seatNumber) => {
    // Check if seat is selected first
    if (selectedSeatsList.includes(seatNumber)) {
      return 'seat-selected'; // Gray - selected by user
    }
    
    // Then check seat status
    const status = seatStatuses[seatNumber];
    
    switch (status) {
      case 'available':
        return 'seat-available'; // Green - can be selected
      case 'booked':
      case 'reserved':
      case 'my_reservation':
      default:
        return 'seat-booked'; // Red - cannot be selected
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
          
          {/* Legend - 3 colors only */}
          <div className="mb-6 flex justify-center space-x-6 flex-wrap">
            <div className="flex items-center mb-2">
              <div className="seat-available w-6 h-6 mr-2"></div>
              <span className="text-sm">Tersedia</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="seat-selected w-6 h-6 mr-2"></div>
              <span className="text-sm">Dipilih</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="seat-booked w-6 h-6 mr-2"></div>
              <span className="text-sm">Terisi</span>
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
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between mb-2">
                    <span>Jumlah Kursi</span>
                    <span>{selectedSeatsList.length}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <span>Harga per Kursi</span>
                    <span>{formatCurrency(route.harga)}</span>
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
                  className={`w-full mt-6 py-3 font-bold rounded-lg transition duration-300 ${
                    selectedSeatsList.length === 0 || isSubmitting
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
                    'Pilih Kursi' : 'Lanjutkan Reservasi'
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
  createTempReservation: PropTypes.func.isRequired
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
  createTempReservation 
})(SeatSelection);