import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { createTempReservation } from '../redux/actions/reservasiActions'; // FIXED: Changed from createReservation
import { formatCurrency, formatDate, formatTime } from '../utils/formatters';

const BookingDetailsPage = ({ 
  user, 
  route, 
  selectedSeats, 
  loading, 
  createTempReservation, // FIXED: Changed from createReservation
  isAuthenticated 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: user ? user.username : '',
    email: user ? user.email : '',
    noTelepon: user ? user.no_telepon : '',
    agreeTerms: false
  });
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/details/${id}` } });
    }
  }, [isAuthenticated, navigate, id]);
  
  // Calculate total price
  useEffect(() => {
    if (route && selectedSeats) {
      setTotalPrice(route.harga * selectedSeats.length);
    }
  }, [route, selectedSeats]);
  
  // Check if seats are selected
  useEffect(() => {
    if (!selectedSeats || selectedSeats.length === 0) {
      navigate(`/booking/${id}`);
    }
  }, [selectedSeats, navigate, id]);
  
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
    
    try {
      const reservationData = {
        id_rute: id,
        nomor_kursi: selectedSeats,
        nama_penumpang: nama,
        email,
        no_telepon: noTelepon
      };
      
      // FIXED: Use createTempReservation instead of createReservation
      const reservation = await createTempReservation(reservationData);
      
      if (reservation && reservation.id_reservasi) {
        // Navigate to booking summary page
        navigate(`/booking/summary/${id}?reservation=${reservation.id_reservasi}`);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      // Error will be handled by the action and displayed via alerts
    }
  };
  
  if (loading || !route) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="container mx-auto px-4 flex justify-center">
            <Spinner />
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Detail Pemesanan</h1>
            <p className="text-gray-600">Lengkapi informasi penumpang untuk melanjutkan pemesanan</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Form Penumpang */}
            <div className="flex-1">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Informasi Penumpang</h2>
                
                <form onSubmit={onSubmit}>
                  <div className="mb-4">
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
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      E-tiket akan dikirimkan ke email ini
                    </p>
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
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={agreeTerms}
                        onChange={onChange}
                        className="mr-2"
                        required
                      />
                      <span className="text-sm">
                        Saya setuju dengan{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">
                          Syarat dan Ketentuan
                        </a>{' '}
                        serta{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                          Kebijakan Privasi
                        </a>
                      </span>
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className={`w-full py-3 font-bold rounded-lg transition duration-300 ${
                      !agreeTerms
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={!agreeTerms}
                  >
                    Lanjutkan ke Reservasi
                  </button>
                </form>
              </div>
            </div>
            
            {/* Detail Pemesanan */}
            <div className="md:w-1/3">
              <div className="bg-white p-6 rounded-lg shadow-md sticky top-4">
                <h2 className="text-xl font-bold mb-4">Ringkasan Pemesanan</h2>
                
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-semibold text-lg">{route.nama_bus}</h3>
                  <div className="flex justify-between mt-2">
                    <div>
                      <p className="text-gray-600 text-sm">Berangkat</p>
                      <p className="font-semibold">{formatDate(route.waktu_berangkat)}</p>
                      <p>{formatTime(route.waktu_berangkat)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Tiba (perkiraan)</p>
                      <p className="font-semibold">{formatDate(route.perkiraan_tiba)}</p>
                      <p>{formatTime(route.perkiraan_tiba)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3">
                    <div>
                      <p className="text-gray-600 text-sm">Dari</p>
                      <p className="font-semibold">{route.asal}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">Ke</p>
                      <p className="font-semibold">{route.tujuan}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Detail Kursi</h3>
                  
                  {selectedSeats && selectedSeats.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedSeats.map(seat => (
                        <span 
                          key={seat} 
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded"
                        >
                          {seat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Belum ada kursi yang dipilih</p>
                  )}
                  
                  <div className="flex justify-between text-sm mb-1">
                    <span>Jumlah Kursi</span>
                    <span>{selectedSeats ? selectedSeats.length : 0}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Harga per Kursi</span>
                    <span>{formatCurrency(route.harga)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    *Kursi akan direservasi selama 30 menit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

BookingDetailsPage.propTypes = {
  user: PropTypes.object,
  route: PropTypes.object,
  selectedSeats: PropTypes.array,
  loading: PropTypes.bool,
  createTempReservation: PropTypes.func.isRequired, // FIXED: Changed from createReservation
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
  user: state.auth.user,
  route: state.rute.selectedRoute,
  selectedSeats: state.tiket.selectedSeats,
  loading: state.rute.loading || state.tiket.loading,
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { createTempReservation })(BookingDetailsPage); // FIXED: Changed from createReservation