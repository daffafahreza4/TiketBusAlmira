import {
  GET_RUTES,
  GET_RUTE,
  RUTE_ERROR,
  CLEAR_RUTE
} from '../types';

const initialState = {
  routes: [],
  selectedRoute: null,
  loading: true,
  error: null
};

const ruteReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_RUTES:
      return {
        ...state,
        routes: payload,
        loading: false,
        error: null
      };
    case GET_RUTE:
      return {
        ...state,
        selectedRoute: payload,
        loading: false,
        error: null
      };
    case RUTE_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_RUTE:
      return {
        ...state,
        selectedRoute: null,
        routes: [],
        loading: true,
        error: null
      };
    default:
      return state;
  }
};

export default ruteReducer;