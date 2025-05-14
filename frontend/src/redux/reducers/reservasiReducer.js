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
      return {
        ...state,
        currentReservation: payload,
        loading: false,
        error: null
      };
    case GET_RESERVASI:
      return {
        ...state,
        reservations: Array.isArray(payload) ? payload : [payload],
        currentReservation: !Array.isArray(payload) ? payload : state.currentReservation,
        loading: false,
        error: null
      };
    case CANCEL_RESERVASI:
      return {
        ...state,
        currentReservation: payload,
        reservations: state.reservations.map(res => 
          res.id_reservasi === payload.id_reservasi ? payload : res
        ),
        loading: false,
        error: null
      };
    case RESERVASI_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_RESERVASI:
      return {
        ...state,
        currentReservation: null,
        error: null
      };
    default:
      return state;
  }
};

export default reservasiReducer;