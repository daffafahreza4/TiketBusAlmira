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

const reservasiReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case CREATE_RESERVASI:
      console.log('🔍 [reservasiReducer] CREATE_RESERVASI:', payload);
      
      // Handle different payload structures
      let newReservation = null;
      
      if (payload) {
        // Case 1: Direct reservation data
        if (payload.reservations && Array.isArray(payload.reservations)) {
          newReservation = payload.reservations[0]; // Take first reservation
        }
        // Case 2: Single reservation object
        else if (payload.id_reservasi || payload.id_tiket) {
          newReservation = payload;
        }
        // Case 3: Nested structure
        else if (payload.data) {
          newReservation = payload.data;
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
      
    case GET_RESERVASI:
      console.log('🔍 [reservasiReducer] GET_RESERVASI:', payload);
      
      // Handle different payload structures for fetching
      let fetchedData = null;
      let fetchedList = [];
      
      if (payload) {
        if (Array.isArray(payload)) {
          // Array of reservations
          fetchedList = payload;
          fetchedData = payload[0] || null; // Set first as current
        } else if (payload.reservations && Array.isArray(payload.reservations)) {
          // Object with reservations array
          fetchedList = payload.reservations;
          fetchedData = payload; // Keep full payload as current
        } else {
          // Single reservation object
          fetchedData = payload;
          fetchedList = [payload];
        }
      }
      
      return {
        ...state,
        reservations: fetchedList,
        currentReservation: fetchedData,
        loading: false,
        error: null
      };
      
    case CANCEL_RESERVASI:
      console.log('🔍 [reservasiReducer] CANCEL_RESERVASI:', payload);
      
      return {
        ...state,
        currentReservation: payload,
        reservations: state.reservations.map(res => {
          // Handle different ID fields
          const resId = res.id_reservasi || res.id_tiket;
          const payloadId = payload.id_reservasi || payload.id_tiket;
          
          return resId === payloadId ? payload : res;
        }),
        loading: false,
        error: null
      };
      
    case RESERVASI_ERROR:
      console.error('❌ [reservasiReducer] RESERVASI_ERROR:', payload);
      
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    case CLEAR_RESERVASI:
      console.log('🔍 [reservasiReducer] CLEAR_RESERVASI');
      
      return {
        ...state,
        currentReservation: null,
        error: null,
        loading: false // Don't reset to loading when clearing
      };
      
    default:
      return state;
  }
};

export default reservasiReducer;