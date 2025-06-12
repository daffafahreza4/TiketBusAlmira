import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Alert />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-blue-600 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Pesan Tiket Bus dengan Mudah
                </h1>
                <p className="text-lg mb-6">
                  Temukan jadwal, rute, dan pemesanan tiket bus terbaik dengan harga terjangkau.
                  Nikmati perjalanan aman dan nyaman bersama Almira.
                </p>
                <Link
                  to="/search-results" 
                  className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded-lg shadow-md hover:bg-gray-100 transition duration-300"
                >
                  Pesan Sekarang
                </Link>
              </div>
              <div className="md:w-1/2">
                <img
                  src="\assets\img\bus.jpg"
                  alt="Bus Travel"
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Kenapa Memilih Kami?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">
                  <i className="fas fa-ticket-alt"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Pemesanan Mudah</h3>
                <p className="text-gray-600">
                  Kini proses pemesanan tiket yang cepat dan mudah. Hanya dengan beberapa klik, Anda siap mencapai tujuan.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">
                  <i className="fas fa-bus"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Pilihan Rute Yang Fleksibel</h3>
                <p className="text-gray-600">
                  Sekarang anda bisa melihat jadwal keberangkatan bus secara langsung.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">
                  <i className="fas fa-money-bill-wave"></i>
                </div>
                <h3 className="text-xl font-bold mb-2">Harga Terbaik</h3>
                <p className="text-gray-600">
                  Harga bus yang bisa dilihat secara langsung untuk kemudahan pembelian tiket.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Siap untuk perjalanan selanjutnya?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Pesan tiket bus Anda sekarang dan nikmati kemudahan serta kenyamanan perjalanan dengan Almira!
            </p>
            <Link
              to="/search-results"
              className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition duration-300"
            >
              Pesan Tiket Sekarang
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;