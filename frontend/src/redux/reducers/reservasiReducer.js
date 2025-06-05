import {
  CREATE_RESERVASI,
  GET_RESERVASI,
  CANCEL_RESERVASI,
  RESERVASI_ERROR,
  CLEAR_RESERVASI
} from '../types';

const initialState = {
  reservations: [],
  currentReservation: null,
  loading: true,
  error: null
};

// Helper function to normalize seat data into consistent array format
const normalizeSeatData = (seats) => {
  if (!seats) return [];
  
  if (Array.isArray(seats)) {
    return seats.filter(seat => seat && seat !== '');
  }
  
  if (typeof seats === 'string') {
    return seats.split(',').map(seat => seat.trim()).filter(seat => seat !== '');
  }
  
  return [seats].filter(seat => seat && seat !== '');
};

const reservasiReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    // Handle new reservation creation with flexible payload structure
    case CREATE_RESERVASI:
      let newReservation = null;
      
      if (payload) {
        // Case 1: Multiple reservations array
        if (payload.reservations && Array.isArray(payload.reservations)) {
          newReservation = {
            ...payload.reservations[0],
            nomor_kursi: normalizeSeatData(payload.reservations[0]?.nomor_kursi || payload.originalSeats)
          };
        }
        // Case 2: Single reservation object
        else if (payload.id_reservasi || payload.id_tiket) {
          newReservation = {
            ...payload,
            nomor_kursi: normalizeSeatData(payload.nomor_kursi || payload.originalSeats)
          };
        }
        // Case 3: Nested data structure
        else if (payload.data) {
          newReservation = {
            ...payload.data,
            nomor_kursi: normalizeSeatData(payload.data.nomor_kursi || payload.originalSeats)
          };
        }
        
        // Preserve original seat data if available
        if (payload.originalSeats && newReservation) {
          newReservation.nomor_kursi = normalizeSeatData(payload.originalSeats);
        }
        if (payload.reservedSeats && newReservation) {
          newReservation.nomor_kursi = normalizeSeatData(payload.reservedSeats);
        }
      }
      
      return {
        ...state,
        currentReservation: newReservation,
        reservations: newReservation ? 
          [...state.reservations, newReservation] : 
          state.reservations,
        loading: false,
        error: null
      };
      
    // Handle fetching reservations with flexible payload structure
    case GET_RESERVASI:
      let fetchedData = null;
      let fetchedList = [];
      
      if (payload) {
        if (Array.isArray(payload)) {
          // Array of reservations
          fetchedList = payload.map(item => ({
            ...item,
            nomor_kursi: normalizeSeatData(item.nomor_kursi)
          }));
          fetchedData = fetchedList[0] || null; // Set first as current
        } else if (payload.reservations && Array.isArray(payload.reservations)) {
          // Object with reservations array
          fetchedList = payload.reservations.map(item => ({
            ...item,
            nomor_kursi: normalizeSeatData(item.nomor_kursi)
          }));
          fetchedData = {
            ...payload,
            nomor_kursi: normalizeSeatData(payload.nomor_kursi || payload.reservedSeats)
          };
        } else {
          // Single reservation object
          fetchedData = {
            ...payload,
            nomor_kursi: normalizeSeatData(payload.nomor_kursi || payload.reservedSeats)
          };
          fetchedList = [fetchedData];
        }
      }
      
      return {
        ...state,
        reservations: fetchedList,
        currentReservation: fetchedData,
        loading: false,
        error: null
      };
      
    // Handle reservation cancellation
    case CANCEL_RESERVASI:
      const cancelledReservation = payload ? {
        ...payload,
        nomor_kursi: normalizeSeatData(payload.nomor_kursi)
      } : payload;
      
      return {
        ...state,
        currentReservation: cancelledReservation,
        reservations: state.reservations.map(res => {
          // Handle different ID fields
          const resId = res.id_reservasi || res.id_tiket;
          const payloadId = payload?.id_reservasi || payload?.id_tiket;
          
          return resId === payloadId ? cancelledReservation : res;
        }),
        loading: false,
        error: null
      };
      
    // Handle reservation-related errors
    case RESERVASI_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    // Clear current reservation (keep loading state false to prevent UI flicker)
    case CLEAR_RESERVASI:
      return {
        ...state,
        currentReservation: null,
        error: null,
        loading: false
      };
      
    default:
      return state;
  }
};

export default reservasiReducer;