import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Spinner from '../layout/Spinner';
import { searchRoutes } from '../../redux/actions/ruteActions';

const SearchRoute = ({ searchRoutes, loading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    asal: '',
    tujuan: '',
    tanggal: ''
  });

  const { asal, tujuan, tanggal } = formData;

  // Set tanggal default ke besok
  useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];

    setFormData({
      ...formData,
      tanggal: formattedDate
    });
  }, []);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = e => {
    e.preventDefault();
    
    if (!asal || !tujuan || !tanggal) {
      return; // Form validation failed
    }

    // Call action to search routes
    searchRoutes({ asal, tujuan, tanggal });
    
    // Navigate to results page
    navigate('/search-results');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Cari Tiket Bus</h2>
      
      {loading ? (
        <Spinner />
      ) : (
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Kota Asal</label>
              <select
                name="asal"
                value={asal}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              >
                <option value="">Pilih Kota Asal</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Semarang">Semarang</option>
                <option value="Malang">Malang</option>
                <option value="Solo">Solo</option>
                <option value="Cirebon">Cirebon</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Kota Tujuan</label>
              <select
                name="tujuan"
                value={tujuan}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                required
              >
                <option value="">Pilih Kota Tujuan</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Semarang">Semarang</option>
                <option value="Malang">Malang</option>
                <option value="Solo">Solo</option>
                <option value="Cirebon">Cirebon</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Tanggal Berangkat</label>
              <input
                type="date"
                name="tanggal"
                value={tanggal}
                onChange={onChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                min={new Date().toISOString().split('T')[0]} // Tidak bisa pilih tanggal sebelum hari ini
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Cari Tiket
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

SearchRoute.propTypes = {
  searchRoutes: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

const mapStateToProps = state => ({
  loading: state.rute.loading
});

export default connect(mapStateToProps, { searchRoutes })(SearchRoute);