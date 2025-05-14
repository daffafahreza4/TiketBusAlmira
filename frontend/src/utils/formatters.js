/**
 * Format number to currency (IDR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to Indonesian format
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

/**
 * Format date to short format (DD/MM/YYYY)
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format time to Indonesian format (HH:MM)
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted time string
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const options = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  };
  
  return new Date(dateString).toLocaleTimeString('id-ID', options);
};

/**
 * Format booking/reservation status to readable text with appropriate color class
 * @param {string} status - Status to format
 * @returns {Object} Object containing formatted text and color class
 */
export const formatStatus = (status) => {
  if (!status) return { text: 'Tidak diketahui', colorClass: 'text-gray-500' };
  
  switch (status.toLowerCase()) {
    case 'pending':
      return { text: 'Menunggu Pembayaran', colorClass: 'text-yellow-600' };
    case 'confirmed':
    case 'paid':
      return { text: 'Dikonfirmasi', colorClass: 'text-green-600' };
    case 'cancelled':
      return { text: 'Dibatalkan', colorClass: 'text-red-600' };
    case 'completed':
      return { text: 'Selesai', colorClass: 'text-blue-600' };
    case 'processing':
      return { text: 'Diproses', colorClass: 'text-blue-600' };
    case 'expired':
      return { text: 'Kadaluarsa', colorClass: 'text-gray-600' };
    default:
      return { text: status, colorClass: 'text-gray-600' };
  }
};

/**
 * Format seat list to string (e.g. "1A, 1B, 1C")
 * @param {Array} seats - Array of seat numbers
 * @returns {string} Formatted seat list
 */
export const formatSeatList = (seats) => {
  if (!seats || seats.length === 0) return '-';
  
  return seats.sort().join(', ');
};