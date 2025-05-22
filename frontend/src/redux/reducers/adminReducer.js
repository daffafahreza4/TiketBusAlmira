import {
  GET_ADMIN_STATS,
  ADMIN_ERROR,
  CLEAR_ADMIN_DATA
} from '../types';

const initialState = {
  stats: null,
  loading: true,
  error: null
};

const adminReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_ADMIN_STATS:
      return {
        ...state,
        stats: payload,
        loading: false,
        error: null
      };
    case ADMIN_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_ADMIN_DATA:
      return {
        ...state,
        stats: null,
        loading: true,
        error: null
      };
    default:
      return state;
  }
};

export default adminReducer;