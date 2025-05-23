import {
  GET_ADMIN_STATS,
  GET_ALL_USERS,
  DELETE_USER_SUCCESS,
  MAKE_USER_ADMIN_SUCCESS,
  ADMIN_ERROR,
  CLEAR_ADMIN_DATA,
  UPDATE_USER_SUCCESS
} from '../types';

const initialState = {
  stats: null,
  users: null,
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
    case GET_ALL_USERS:
      return {
        ...state,
        users: payload,
        loading: false,
        error: null
      };
    case DELETE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.filter(user => user.id_user !== payload),
        loading: false,
        error: null
      };
    case MAKE_USER_ADMIN_SUCCESS:
      return {
        ...state,
        users: state.users.map(user =>
          user.id_user === payload.id_user
            ? { ...user, role: payload.role }
            : user
        ),
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
        users: null,
        loading: true,
        error: null
      };
    case UPDATE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.map(user =>
          user.id_user === payload.id_user
            ? payload
            : user
        ),
        loading: false,
        error: null
      };
    default:
      return state;
  }
};

export default adminReducer;