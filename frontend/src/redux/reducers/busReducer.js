import {
  GET_BUSES,
  GET_BUS,
  ADD_BUS,
  UPDATE_BUS,
  DELETE_BUS,
  BUS_ERROR,
  CLEAR_BUS
} from '../types';

const initialState = {
  buses: [],
  selectedBus: null,
  loading: false,
  error: null
};

const busReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_BUSES:
      return {
        ...state,
        buses: payload || [],
        loading: false,
        error: null
      };
    case GET_BUS:
      return {
        ...state,
        selectedBus: payload,
        loading: false,
        error: null
      };
    case ADD_BUS:
      return {
        ...state,
        buses: [...state.buses, payload],
        loading: false,
        error: null
      };
    case UPDATE_BUS:
      return {
        ...state,
        buses: state.buses.map(bus =>
          bus.id_bus === payload.id_bus ? payload : bus
        ),
        selectedBus: state.selectedBus && state.selectedBus.id_bus === payload.id_bus 
          ? payload 
          : state.selectedBus,
        loading: false,
        error: null
      };
    case DELETE_BUS:
      return {
        ...state,
        buses: state.buses.filter(bus => bus.id_bus !== payload),
        selectedBus: state.selectedBus && state.selectedBus.id_bus === payload 
          ? null 
          : state.selectedBus,
        loading: false,
        error: null
      };
    case BUS_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    case CLEAR_BUS:
      return {
        ...initialState
      };
    default:
      return state;
  }
};

export default busReducer;