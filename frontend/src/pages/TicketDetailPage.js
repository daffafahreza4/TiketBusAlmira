import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { getTicketById } from '../redux/actions/tiketActions';
import { cancelReservation } from '../redux/actions/reservasiActions';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../utils/formatters';

const TicketDetailPage = ({ 
  getTicketById,
  cancelReservation, 
  ticket, 
  loading, 
  error 
}) => {
  const { id } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  useEffect(() => {
    if (id) {
      getTicketById(id);
    }
  }, [getTicketById, id]);
  
  const handlePrintTicket = () => {
    window.open(`/ticket/print/${id}`, '_blank');
  };
  
  const handleCancelTicket = () => {
    cancelReservation(id);
    setShowCancelModal(false);
  };
  
  if (loading || !ticket) {
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
  
  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
            <Link to="/my-tickets" className="text-blue-600 hover:underline">
              &larr; Kembali ke daftar tiket
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const status = formatStatus(ticket.status_tiket);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />
      
      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Link to="/my-tickets" className="text-blue-600 hover:underline">
                &larr; Kembali ke daftar tiket
              </Link>
              <h1 className="text-2xl font-bold mt-2">Detail Tiket</h1>
            </div>
            <div className={`${status.colorClass} font-semibold px-4 py-2 rounded-full text-sm bg-opacity-20`}>
              {status.text}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Ticket Header */}
            <div className="p-6 border-b">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-bold">{ticket.rute.asal} - {ticket.rute.tujuan}</h2>
                  <p className="text-gray-600">{ticket.rute.nama_bus}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-gray-600 text-sm">Nomor Tiket</p>
                  <p className="font-semibold">TB-{ticket.id_tiket}</p>
                </div>
              </div>
            </div>
            
            {/* Ticket Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold mb-4 text-lg">Informasi Perjalanan</h3>
                  
                  <div className="space-y-4">
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Tanggal</div>
                      <div className="w-2/3 font-semibold">{formatDate(ticket.rute.waktu_berangkat)}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Jam Berangkat</div>
                      <div className="w-2/3 font-semibold">{formatTime(ticket.rute.waktu_berangkat)}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Terminal Asal</div>
                      <div className="w-2/3 font-semibold">{ticket.rute.terminal_asal || `Terminal ${ticket.rute.asal}`}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Terminal Tujuan</div>
                      <div className="w-2/3 font-semibold">{ticket.rute.terminal_tujuan || `Terminal ${ticket.rute.tujuan}`}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Nomor Kursi</div>
                      <div className="w-2/3 font-semibold">{ticket.nomor_kursi}</div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1/3 text-gray-600">Fasilitas</div>
                      <div className="w-2/3">
                        {ticket.rute.fasilitas ? (
                          <div className="flex flex-wrap gap-2">
                            {ticket.rute.fasilitas.split(',').map((item, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                              >
                                {item.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Standar</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-4 text-lg">Informasi Penumpang & Pembayaran</h3>
                  
                  <div className="space-y-4">
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Nama</div>
                      <div className="w-2/3 font-semibold">{ticket.user.username}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Email</div>
                      <div className="w-2/3 font-semibold">{ticket.user.email}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">No. Telepon</div>
                      <div className="w-2/3 font-semibold">{ticket.user.no_telepon}</div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Metode Pembayaran</div>
                      <div className="w-2/3 font-semibold">
                        {ticket.pembayaran ? ticket.pembayaran.metode : 'Belum dibayar'}
                      </div>
                    </div>
                    
                    <div className="flex border-b pb-3">
                      <div className="w-1/3 text-gray-600">Waktu Pembayaran</div>
                      <div className="w-2/3 font-semibold">
                        {ticket.pembayaran && ticket.pembayaran.waktu_pembayaran 
                          ? formatDate(ticket.pembayaran.waktu_pembayaran) + ' ' + formatTime(ticket.pembayaran.waktu_pembayaran)
                          : '-'
                        }
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="w-1/3 text-gray-600">Total Bayar</div>
                      <div className="w-2/3 font-bold text-lg">
                        {formatCurrency(ticket.total_bayar)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="border-t pt-6 flex flex-wrap justify-end gap-3">
                {ticket.status_tiket === 'pending' && (
                  <Link
                    to={`/payment/${ticket.id_pembayaran}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Bayar Sekarang
                  </Link>
                )}
                
                {ticket.status_tiket === 'confirmed' && (
                  <button
                    onClick={handlePrintTicket}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Cetak Tiket
                  </button>
                )}
                
                {(ticket.status_tiket === 'confirmed' || ticket.status_tiket === 'pending') && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Batalkan Tiket
                  </button>
                )}
              </div>
            </div>
            
            {/* Important Notes */}
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-bold text-yellow-800 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                Penting:
              </h3>
              <ul className="list-disc pl-6 text-yellow-800 space-y-1">
                <li>Harap tiba di terminal minimal 30 menit sebelum keberangkatan.</li>
                <li>Tiket ini harus ditunjukkan kepada petugas sebelum naik bus.</li>
                <li>Pembatalan tiket harus dilakukan minimal 24 jam sebelum keberangkatan.</li>
                <li>Bagasi yang diperbolehkan maksimal 20kg per penumpang.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      {/* Cancel Ticket Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Batalkan Tiket</h2>
            <p className="mb-6 text-gray-700">
              Apakah Anda yakin ingin membatalkan tiket ini? Pembatalan tiket tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleCancelTicket}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Ya, Batalkan Tiket
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

TicketDetailPage.propTypes = {
  getTicketById: PropTypes.func.isRequired,
  cancelReservation: PropTypes.func.isRequired,
  ticket: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  ticket: state.tiket.selectedTicket,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { getTicketById, cancelReservation })(TicketDetailPage);