import {
  GET_ADMIN_ROUTES,
  GET_ADMIN_ROUTE,
  ADD_ADMIN_ROUTE,
  UPDATE_ADMIN_ROUTE,
  DELETE_ADMIN_ROUTE,
  ROUTE_ADMIN_ERROR,
  CLEAR_ROUTE_ADMIN
} from '../types';

const initialState = {
  routes: [],
  selectedRoute: null,
  loading: false,
  error: null
};

const routeAdminReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_ADMIN_ROUTES:
      return {
        ...state,
        routes: payload || [],
        loading: false,
        error: null
      };
    case GET_ADMIN_ROUTE:
      return {
        ...state,
        selectedRoute: payload,
        loading: false,
        error: null
      };
    case ADD_ADMIN_ROUTE:
      return {
        ...state,
        routes: [...state.routes, payload],
        loading: false,
        error: null
      };
    case UPDATE_ADMIN_ROUTE:
      return {
        ...state,
        routes: state.routes.map(route =>
          route.id_rute === payload.id_rute ? payload : route
        ),
        selectedRoute: state.selectedRoute && state.selectedRoute.id_rute === payload.id_rute 
          ? payload 
          : state.selectedRoute,
        loading: false,
        error: null
      };
    case DELETE_ADMIN_ROUTE:
      return {
        ...state,
        routes: state.routes.filter(route => route.id_rute !== payload),
        selectedRoute: state.selectedRoute && state.selectedRoute.id_rute === payload 
          ? null 
          : state.selectedRoute,
        loading: false,
        error: null
      };
    case ROUTE_ADMIN_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_ROUTE_ADMIN:
      return {
        ...initialState
      };
    default:
      return state;
  }
};

export default routeAdminReducer;