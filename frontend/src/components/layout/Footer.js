import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold mb-4">Almira</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Layanan pemesanan tiket bus terpercaya dengan berbagai pilihan rute dan jadwal.
            </p>
            <div className="flex space-x-4 mt-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-lg"></i>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter text-lg"></i>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram text-lg"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Link Cepat</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link 
                  to="/search-results" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Pesan Tiket
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Informasi</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/" 
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Kontak</h3>
            <ul className="space-y-3">
              <li className="flex items-start text-gray-400 text-sm">
                <i className="fas fa-map-marker-alt mt-1 mr-3 flex-shrink-0"></i>
                <span>Jl. Terusan Ryacudu, Way Huwi, Kec. Jati Agung, Kabupaten Lampung Selatan, Lampung</span>
              </li>
              <li className="flex items-center text-gray-400 text-sm">
                <i className="fas fa-phone mr-3 flex-shrink-0"></i>
                <span>+62 853 8147 1685</span>
              </li>
              <li className="flex items-center text-gray-400 text-sm">
                <i className="fas fa-envelope mr-3 flex-shrink-0"></i>
                <span>Almira@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <p className="text-gray-400 text-center text-sm">
            &copy; {new Date().getFullYear()} Daffa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;