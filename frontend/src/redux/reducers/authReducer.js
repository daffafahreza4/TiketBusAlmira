import {
  USER_LOADED,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  AUTH_ERROR,
  LOGOUT,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_FAIL,
  VERIFY_OTP_SUCCESS,
  VERIFY_OTP_FAIL,
  RESEND_OTP_SUCCESS,
  RESEND_OTP_FAIL
} from '../types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null,
  error: null,
  requiresVerification: false,
  verificationEmail: null
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
        error: null,
        requiresVerification: false,
        verificationEmail: null
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
        error: null,
        requiresVerification: payload.requiresVerification || false,
        verificationEmail: payload.email || null
      };
      
    case LOGIN_SUCCESS:
      const loginToken = payload.data?.token;
      if (loginToken) {
        localStorage.setItem('token', loginToken);
      }
      return {
        ...state,
        token: loginToken,
        isAuthenticated: false, // Will be set to true when USER_LOADED is dispatched
        loading: false,
        error: null,
        requiresVerification: false,
        verificationEmail: null
      };
      
    case VERIFY_OTP_SUCCESS:
      const verifyToken = payload.data?.token;
      if (verifyToken) {
        localStorage.setItem('token', verifyToken);
      }
      return {
        ...state,
        token: verifyToken,
        isAuthenticated: false, // Will be set to true when USER_LOADED is dispatched
        loading: false,
        error: null,
        requiresVerification: false,
        verificationEmail: null
      };
      
    case RESEND_OTP_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null
      };
      
    case UPDATE_PROFILE_SUCCESS:
      return {
        ...state,
        user: payload.data || payload,
        loading: false,
        error: null,
        requiresVerification: payload.requiresVerification || false,
        verificationEmail: payload.requiresVerification ? (payload.data?.email || payload.email) : null
      };
      
    case REGISTER_FAIL:
    case LOGIN_FAIL:
    case VERIFY_OTP_FAIL:
    case RESEND_OTP_FAIL:
      return {
        ...state,
        error: payload,
        loading: false
      };
      
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
        error: payload,
        requiresVerification: false,
        verificationEmail: null
      };
      
    default:
      return state;
  }
};

export default authReducer;