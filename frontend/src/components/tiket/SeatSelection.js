import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { getAvailableSeats, setSelectedSeats } from '../../redux/actions/tiketActions';
import { formatCurrency } from '../../utils/formatters';

const SeatSelection = ({ 
  routeId, 
  route, 
  availableSeats, 
  selectedSeats, 
  loading, 
  error,
  getAvailableSeats, 
  setSelectedSeats 
}) => {
  const navigate = useNavigate();
  const [selectedSeatsList, setSelectedSeatsList] = useState(selectedSeats || []);
  const [totalPrice, setTotalPrice] = useState(0);

  // Ambil data kursi yang tersedia saat komponen dimuat
  useEffect(() => {
    if (routeId) {
      getAvailableSeats(routeId);
    }
  }, [getAvailableSeats, routeId]);

  // Update total harga saat kursi dipilih
  useEffect(() => {
    if (route && selectedSeatsList) {
      setTotalPrice(route.harga * selectedSeatsList.length);
    }
  }, [route, selectedSeatsList]);

  // Handle klik pada kursi
  const handleSeatClick = (seatNumber) => {
    // Cek apakah kursi tersedia
    if (!availableSeats.includes(seatNumber)) {
      return; // Kursi sudah terisi, abaikan klik
    }

    // Cek apakah kursi sudah dipilih sebelumnya
    if (selectedSeatsList.includes(seatNumber)) {
      // Hapus kursi dari daftar yang dipilih
      setSelectedSeatsList(selectedSeatsList.filter(seat => seat !== seatNumber));
    } else {
      // Tambahkan kursi ke daftar yang dipilih
      setSelectedSeatsList([...selectedSeatsList, seatNumber]);
    }
  };

  // Handle submit pemilihan kursi
  const handleSubmit = () => {
    if (selectedSeatsList.length === 0) {
      alert('Silakan pilih minimal 1 kursi');
      return;
    }

    // Simpan kursi yang dipilih ke Redux store
    setSelectedSeats(selectedSeatsList);

    // Navigasi ke halaman pemesanan
    navigate(`/booking/details/${routeId}`);
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        {error}
      </div>
    );
  }

  // Generasi grid kursi bus
  const generateBusLayout = () => {
    // Asumsi bahwa bus memiliki 10 baris dengan 4 kursi per baris (2-2)
    const rows = 10;
    const layout = [];

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      
      // Kursi di sisi kiri (A & B)
      rowSeats.push(
        <div key={`${row}A`} className="flex gap-1">
          <div 
            className={`seat ${getSeatClass(`${row}A`)}`}
            onClick={() => handleSeatClick(`${row}A`)}
          >
            {row}A
          </div>
          <div 
            className={`seat ${getSeatClass(`${row}B`)}`}
            onClick={() => handleSeatClick(`${row}B`)}
          >
            {row}B
          </div>
        </div>
      );
      
      // Lorong (aisle)
      rowSeats.push(
        <div key={`aisle-${row}`} className="w-8"></div>
      );
      
      // Kursi di sisi kanan (C & D)
      rowSeats.push(
        <div key={`${row}C`} className="flex gap-1">
          <div 
            className={`seat ${getSeatClass(`${row}C`)}`}
            onClick={() => handleSeatClick(`${row}C`)}
          >
            {row}C
          </div>
          <div 
            className={`seat ${getSeatClass(`${row}D`)}`}
            onClick={() => handleSeatClick(`${row}D`)}
          >
            {row}D
          </div>
        </div>
      );
      
      // Tambahkan baris ke layout
      layout.push(
        <div key={`row-${row}`} className="flex justify-center items-center mb-2">
          {rowSeats}
        </div>
      );
    }

    return layout;
  };

  // Fungsi untuk menentukan class CSS untuk setiap kursi
  const getSeatClass = (seatNumber) => {
    if (!availableSeats.includes(seatNumber)) {
      return 'seat-booked'; // Kursi sudah dipesan orang lain
    }
    
    if (selectedSeatsList.includes(seatNumber)) {
      return 'seat-selected'; // Kursi dipilih oleh pengguna
    }
    
    return 'seat-available'; // Kursi tersedia
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-center">Pilih Kursi</h2>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          {/* Informasi Bus */}
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
          
          {/* Legenda */}
          <div className="mb-6 flex justify-center space-x-4">
            <div className="flex items-center">
              <div className="seat-available w-6 h-6 mr-2"></div>
              <span className="text-sm">Tersedia</span>
            </div>
            <div className="flex items-center">
              <div className="seat-selected w-6 h-6 mr-2"></div>
              <span className="text-sm">Dipilih</span>
            </div>
            <div className="flex items-center">
              <div className="seat-booked w-6 h-6 mr-2"></div>
              <span className="text-sm">Terisi</span>
            </div>
          </div>
          
          {/* Layout Bus */}
          <div className="bus-layout mb-8">
            {/* Bagian depan bus */}
            <div className="text-center mb-4">
              <div className="driver-area mx-auto w-24 h-10 bg-gray-300 rounded-t-lg flex items-center justify-center">
                <span className="text-xs text-gray-700">SOPIR</span>
              </div>
            </div>
            
            {/* Layout kursi */}
            <div className="seats-container py-4 px-6 border border-gray-300 rounded-lg">
              {generateBusLayout()}
            </div>
            
            {/* Bagian belakang bus */}
            <div className="text-center mt-4">
              <div className="back-area mx-auto w-full h-6 bg-gray-200 rounded-b-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Ringkasan Pemesanan */}
        <div className="md:w-1/3">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                  disabled={selectedSeatsList.length === 0}
                  className={`w-full mt-6 py-3 font-bold rounded-lg transition duration-300 ${
                    selectedSeatsList.length === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedSeatsList.length === 0 ? 'Pilih Kursi' : 'Lanjutkan Pemesanan'}
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
  availableSeats: PropTypes.array,
  selectedSeats: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
  getAvailableSeats: PropTypes.func.isRequired,
  setSelectedSeats: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  route: state.rute.selectedRoute,
  availableSeats: state.tiket.availableSeats,
  selectedSeats: state.tiket.selectedSeats,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { getAvailableSeats, setSelectedSeats })(SeatSelection);