import {
  GET_BOOKING_SUMMARY,
  CREATE_BOOKING_SUCCESS,
  BOOKING_ERROR,
  CLEAR_BOOKING
} from '../types';

const initialState = {
  bookingSummary: null,
  currentBooking: null,
  loading: false,
  error: null
};

const bookingReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_BOOKING_SUMMARY:
      return {
        ...state,
        bookingSummary: payload,
        loading: false,
        error: null
      };
      
    case CREATE_BOOKING_SUCCESS:
      return {
        ...state,
        currentBooking: payload,
        loading: false,
        error: null
      };
      
    case BOOKING_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
      
    case CLEAR_BOOKING:
      return {
        ...initialState
      };
      
    default:
      return state;
  }
};

export default bookingReducer;