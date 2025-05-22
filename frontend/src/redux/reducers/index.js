import { combineReducers } from 'redux';
import authReducer from './authReducer';
import alertReducer from './alertReducer';
import ruteReducer from './ruteReducer';
import tiketReducer from './tiketReducer';
import reservasiReducer from './reservasiReducer';
import adminReducer from './adminReducer';

export default combineReducers({
  auth: authReducer,
  alert: alertReducer,
  rute: ruteReducer,
  tiket: tiketReducer,
  reservasi: reservasiReducer,
  admin: adminReducer,
});