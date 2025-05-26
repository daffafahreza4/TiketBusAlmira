import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import { getUserTickets } from '../redux/actions/tiketActions';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../utils/formatters';

const MyTicketsPage = ({ getUserTickets, tickets, loading, error }) => {
  const [filter, setFilter] = useState('all');
  const [filteredTickets, setFilteredTickets] = useState([]);
  
  useEffect(() => {
    getUserTickets();
  }, [getUserTickets]);
  
  // Filter tickets based on status
  useEffect(() => {
    if (tickets) {
      if (filter === 'all') {
        setFilteredTickets(tickets);
      } else {
        setFilteredTickets(tickets.filter(ticket => 
          ticket.status_tiket.toLowerCase() === filter
        ));
      }
    }
  }, [tickets, filter]);
  
  const handleFilterChange = e => {
    setFilter(e.target.value);
  };
  
  if (loading) {
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
      
      {/* Alert with proper spacing */}
      <div className="content-with-navbar">
          <Alert />
      </div>

      <main className="flex-grow bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Tiket Saya</h1>
            <div>
              <select
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filter}
                onChange={handleFilterChange}
              >
                <option value="all">Semua Tiket</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="pending">Menunggu Pembayaran</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
          
          {error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-5xl text-gray-300 mb-4">
                <i className="fas fa-ticket-alt"></i>
              </div>
              <h2 className="text-xl font-bold mb-2">Tidak Ada Tiket</h2>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? 'Anda belum memiliki tiket. Pesan tiket sekarang untuk perjalanan Anda!' 
                  : `Tidak ada tiket dengan status "${filter}" saat ini.`}
              </p>
              <Link
                to="/search-results"
                className="inline-block px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Pesan Tiket
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map(ticket => {
                const status = formatStatus(ticket.status_tiket);
                return (
                  <div 
                    key={ticket.id_tiket} 
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-bold">{ticket.rute.asal} - {ticket.rute.tujuan}</h2>
                          <p className="text-gray-600">{ticket.rute.nama_bus}</p>
                        </div>
                        <div className={`${status.colorClass} font-semibold px-3 py-1 rounded-full text-sm bg-opacity-20`}>
                          {status.text}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-gray-600 text-sm">Tanggal Keberangkatan</p>
                          <p className="font-semibold">{formatDate(ticket.rute.waktu_berangkat)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Jam Berangkat</p>
                          <p className="font-semibold">{formatTime(ticket.rute.waktu_berangkat)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Nomor Kursi</p>
                          <p className="font-semibold">{ticket.nomor_kursi}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap justify-between items-center border-t pt-4">
                        <div>
                          <p className="text-gray-600 text-sm">Total Bayar</p>
                          <p className="font-bold text-lg">{formatCurrency(ticket.total_bayar)}</p>
                        </div>
                        
                        <div className="space-x-2">
                          {ticket.status_tiket === 'pending' && (
                            <Link
                              to={`/payment/${ticket.id_pembayaran}`}
                              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              Bayar Sekarang
                            </Link>
                          )}
                          
                          <Link
                            to={`/ticket/${ticket.id_tiket}`}
                            className="inline-block px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm"
                          >
                            Lihat Detail
                          </Link>
                          
                          {ticket.status_tiket === 'confirmed' && (
                            <button
                              className="inline-block px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                              onClick={() => window.open(`/ticket/print/${ticket.id_tiket}`, '_blank')}
                            >
                              Cetak Tiket
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

MyTicketsPage.propTypes = {
  getUserTickets: PropTypes.func.isRequired,
  tickets: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string
};

const mapStateToProps = state => ({
  tickets: state.tiket.tickets,
  loading: state.tiket.loading,
  error: state.tiket.error
});

export default connect(mapStateToProps, { getUserTickets })(MyTicketsPage);