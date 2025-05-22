import {
  USER_LOADED,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  AUTH_ERROR,
  LOGOUT,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_FAIL
} from '../types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null
};

const authReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: payload,
        error: null
      };
    case REGISTER_SUCCESS:
      const registerToken = payload.data?.token;
      if (registerToken) {
        localStorage.setItem('token', registerToken);
      }
      return {
        ...state,
        token: registerToken,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case LOGIN_SUCCESS:
      const loginToken = payload.data?.token;
      if (loginToken) {
        localStorage.setItem('token', loginToken);
      }
      return {
        ...state,
        token: loginToken,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: payload,
        loading: false,
        error: null
      };
    case REGISTER_FAIL:
    case LOGIN_FAIL:
    case AUTH_ERROR:
    case LOGOUT:
    case UPDATE_PROFILE_FAIL:
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: payload
      };
    default:
      return state;
  }
};

export default authReducer;