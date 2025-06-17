import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Almira</h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto md:mx-0">
              Layanan pemesanan tiket bus terpercaya dengan berbagai pilihan rute dan jadwal.
            </p>
            <div className="flex justify-center md:justify-start space-x-4 mt-4 sm:mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-base sm:text-lg"></i>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter text-base sm:text-lg"></i>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-base sm:text-lg"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Link Cepat</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/search-results"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Pesan Tiket
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm sm:text-base inline-block"
                >
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Kontak</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex flex-col md:flex-row md:items-start text-gray-400 text-xs sm:text-sm">
                <i className="fas fa-map-marker-alt mb-1 md:mb-0 md:mt-1 md:mr-3 flex-shrink-0 mx-auto md:mx-0"></i>
                <span className="text-center md:text-left leading-relaxed">
                  Jl. Terusan Ryacudu, Way Huwi, Kec. Jati Agung, Kabupaten Lampung Selatan, Lampung
                </span>
              </li>
              <li className="flex flex-col md:flex-row md:items-center text-gray-400 text-xs sm:text-sm">
                <i className="fas fa-phone mb-1 md:mb-0 md:mr-3 flex-shrink-0 mx-auto md:mx-0"></i>
                <span>+62 812-2549-6270</span>
              </li>
              <li className="flex flex-col md:flex-row md:items-center text-gray-400 text-xs sm:text-sm">
                <i className="fas fa-envelope mb-1 md:mb-0 md:mr-3 flex-shrink-0 mx-auto md:mx-0"></i>
                <span>Almira@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-4 sm:pt-6">
          <p className="text-gray-400 text-center text-xs sm:text-sm">
            &copy; 2025 Almira Tiket. All rights reserved.
          </p>
          <p className="text-gray-400 text-center text-xs sm:text-sm mt-1 sm:mt-2">
            Developed by Muhammad Daffa Fahreza
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;