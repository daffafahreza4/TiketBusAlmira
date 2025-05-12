import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap">
          <div className="w-full md:w-1/4 mb-8">
            <h3 className="text-xl font-bold mb-4">TicketBus</h3>
            <p className="mb-4 text-gray-400">
              Layanan pemesanan tiket bus online terpercaya dengan berbagai pilihan rute dan jadwal.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          <div className="w-full md:w-1/4 mb-8">
            <h3 className="text-lg font-bold mb-4">Link Cepat</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-400 hover:text-white">
                  Pesan Tiket
                </Link>
              </li>
              <li>
                <Link to="/rute" className="text-gray-400 hover:text-white">
                  Rute & Jadwal
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/4 mb-8">
            <h3 className="text-lg font-bold mb-4">Informasi</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/4 mb-8">
            <h3 className="text-lg font-bold mb-4">Kontak</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="mr-2">
                  <i className="fas fa-map-marker-alt"></i>
                </span>
                <span>Jl. Pahlawan No. 123, Jakarta Pusat, Indonesia</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">
                  <i className="fas fa-phone"></i>
                </span>
                <span>+62 21 1234 5678</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">
                  <i className="fas fa-envelope"></i>
                </span>
                <span>info@ticketbus.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 mt-4">
          <p className="text-gray-400 text-center">
            &copy; {new Date().getFullYear()} TicketBus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;