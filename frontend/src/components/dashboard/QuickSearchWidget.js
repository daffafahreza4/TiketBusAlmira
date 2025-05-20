import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickSearchWidget = () => {
  const navigate = useNavigate();

  const handleViewSchedule = () => {
    navigate('/search-results');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <h3 className="text-lg font-bold mb-4">Jadwal Keberangkatan</h3>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Lihat semua jadwal keberangkatan bus yang tersedia hari ini dan hari-hari mendatang.
        </p>
        
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Rute Tersedia</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-gray-600">Bus Aktif</div>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleViewSchedule}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300"
      >
        Lihat Jadwal Lengkap
      </button>
    </div>
  );
};

export default QuickSearchWidget;