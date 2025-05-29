import {
  GET_TICKETS,
  GET_TICKET,
  GET_AVAILABLE_SEATS,
  SET_SELECTED_SEATS,
  CLEAR_SELECTED_SEATS,
  TICKET_ERROR
} from '../types';

const initialState = {
  tickets: [],
  selectedTicket: null,
  availableSeats: null, // Changed from [] to null for better state tracking
  selectedSeats: [],
  loading: false, // Start with false, will be set to true by actions
  error: null
};

const tiketReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_TICKETS:
      return {
        ...state,
        tickets: payload || [],
        loading: false,
        error: null
      };
      
    case GET_TICKET:
      return {
        ...state,
        selectedTicket: payload,
        loading: false,
        error: null
      };
      
    case GET_AVAILABLE_SEATS:
      // If payload is null, we're starting to load
      if (payload === null) {
        return {
          ...state,
          loading: true,
          error: null
        };
      }
      
      return {
        ...state,
        availableSeats: payload,
        loading: false,
        error: null
      };
      
    case SET_SELECTED_SEATS:
      return {
        ...state,
        selectedSeats: payload || [],
        error: null
      };
      
    case CLEAR_SELECTED_SEATS:
      return {
        ...state,
        selectedSeats: [],
        error: null
      };
      
    case TICKET_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    default:
      return state;
  }
};

export default tiketReducer;