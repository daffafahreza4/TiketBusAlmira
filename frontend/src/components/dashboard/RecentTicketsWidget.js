import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, formatTime, formatStatus } from '../../utils/formatters';

const RecentTicketsWidget = ({ tickets = [], loading = false }) => {
  // Process and group tickets similar to MyTicketsPage logic
  const recentGroupedTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];

    // Group tickets by order and filter based on status
    const groupedOrders = [];
    const processedTickets = new Set();
    
    tickets.forEach(ticket => {
      if (processedTickets.has(ticket.id_tiket)) return;
      
      if (ticket.order_group_id) {
        // Find all tickets in the same order group
        const orderTickets = tickets.filter(t => 
          t.order_group_id === ticket.order_group_id
        );
        
        // Mark all tickets in this group as processed
        orderTickets.forEach(t => processedTickets.add(t.id_tiket));
        
        // Create order object
        const masterTicket = orderTickets.find(t => t.is_master_ticket) || orderTickets[0];
        const allSeats = orderTickets.map(t => t.nomor_kursi).sort();
        const totalAmount = orderTickets.reduce((sum, t) => sum + parseFloat(t.total_bayar || 0), 0);
        
        groupedOrders.push({
          type: 'order',
          order_group_id: ticket.order_group_id,
          master_ticket_id: masterTicket.id_tiket,
          total_tickets: orderTickets.length,
          seats: allSeats,
          status_tiket: masterTicket.status_tiket,
          total_bayar: masterTicket.order_total_amount || totalAmount,
          tanggal_pemesanan: masterTicket.tanggal_pemesanan,
          batas_pembayaran: masterTicket.batas_pembayaran,
          rute: masterTicket.rute || masterTicket.Rute,
          user: masterTicket.user || masterTicket.User,
          pembayaran: masterTicket.pembayaran || masterTicket.Pembayaran,
          tickets: orderTickets
        });
      } else {
        // Single ticket (legacy or single seat orders)
        processedTickets.add(ticket.id_tiket);
        groupedOrders.push({
          type: 'single',
          ...ticket,
          seats: [ticket.nomor_kursi],
          total_tickets: 1,
          master_ticket_id: ticket.id_tiket
        });
      }
    });

    // Sort by booking date (newest first) and take only 1 most recent
    return groupedOrders
      .sort((a, b) => new Date(b.tanggal_pemesanan) - new Date(a.tanggal_pemesanan))
      .slice(0, 1);
  }, [tickets]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-full">
        <h3 className="text-lg font-bold mb-4">Tiket Terbaru</h3>
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Tiket Terbaru</h3>
        <Link to="/my-tickets" className="text-sm text-pink-600 hover:underline">
          Lihat Semua
        </Link>
      </div>
      
      {recentGroupedTickets.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-md text-center">
          <div className="text-4xl text-gray-300 mb-2">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <p className="text-gray-600">Belum ada tiket</p>
          <Link 
            to="/search-results" 
            className="mt-3 inline-block text-pink-600 hover:underline text-sm"
          >
            Pesan tiket pertama Anda →
          </Link>
        </div>
      ) : (
        <div>
          {recentGroupedTickets.map(order => {
            const status = formatStatus(order.status_tiket);
            const route = order.rute || order.Rute;
            const ticketId = order.master_ticket_id || order.id_tiket;
            
            return (
              <div 
                key={order.order_group_id || order.id_tiket} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {route?.asal} → {route?.tujuan}
                    </h4>
                    {order.type === 'order' && order.total_tickets > 1 && (
                      <span className="inline-block mt-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                        {order.total_tickets} Tiket
                      </span>
                    )}
                  </div>
                  <div className={`${status.colorClass} font-semibold px-2 py-1 rounded-full text-xs bg-opacity-20`}>
                    {status.text}
                  </div>
                </div>
                
                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Tanggal:</span>
                    <div>{formatDate(route?.waktu_berangkat)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Jam:</span>
                    <div>{formatTime(route?.waktu_berangkat)}</div>
                  </div>
                </div>
                
                {/* Seats */}
                <div className="mb-3">
                  <span className="text-xs text-gray-600 font-medium">Kursi: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.seats.slice(0, 3).map((seat, index) => (
                      <span 
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                      >
                        {seat}
                      </span>
                    ))}
                    {order.seats.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        +{order.seats.length - 3} lagi
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex justify-between items-center">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.total_bayar)}
                  </div>
                  <Link
                    to={`/ticket/${ticketId}`}
                    className="text-xs text-pink-600 hover:underline font-medium"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {recentGroupedTickets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link 
            to="/my-tickets" 
            className="block text-center text-sm text-pink-600 hover:underline font-medium"
          >
            Lihat Semua Tiket ({tickets.length})
          </Link>
        </div>
      )}
    </div>
  );
};

RecentTicketsWidget.propTypes = {
  tickets: PropTypes.array,
  loading: PropTypes.bool
};

export default RecentTicketsWidget;