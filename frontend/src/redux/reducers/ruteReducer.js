import {
  GET_RUTES,
  GET_RUTE,
  SEARCH_RUTES,
  RUTE_ERROR,
  CLEAR_RUTE
} from '../types';

const initialState = {
  routes: [],
  selectedRoute: null,
  searchParams: null,
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
    case SEARCH_RUTES:
      return {
        ...state,
        routes: payload.routes,
        searchParams: payload.searchParams,
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
        error: null
      };
    default:
      return state;
  }
};

export default ruteReducer;