import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { searchRoutes } from '../../redux/actions/ruteActions';

const QuickSearchWidget = ({ searchRoutes, loading }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    asal: '',
    tujuan: '',
    tanggal: ''
  });

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

  const { asal, tujuan, tanggal } = formData;

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
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-bold mb-4">Pencarian Cepat</h3>
      
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm">Kota Asal</label>
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
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm">Kota Tujuan</label>
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
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm">Tanggal Berangkat</label>
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
        
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Mencari...' : 'Cari Tiket'}
        </button>
      </form>
    </div>
  );
};

QuickSearchWidget.propTypes = {
  searchRoutes: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

QuickSearchWidget.defaultProps = {
  loading: false
};

const mapStateToProps = state => ({
  loading: state.rute.loading
});

export default connect(mapStateToProps, { searchRoutes })(QuickSearchWidget);