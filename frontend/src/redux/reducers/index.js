import { combineReducers } from 'redux';
import authReducer from './authReducer';
import alertReducer from './alertReducer';
import ruteReducer from './ruteReducer';
import tiketReducer from './tiketReducer';
import reservasiReducer from './reservasiReducer';
import adminReducer from './adminReducer';
import busReducer from './busReducer';
import routeAdminReducer from './routeAdminReducer';
import ticketAdminReducer from './ticketAdminReducer';
import bookingReducer from './bookingReducer';

export default combineReducers({
  auth: authReducer,
  alert: alertReducer,
  rute: ruteReducer,
  tiket: tiketReducer,
  reservasi: reservasiReducer,
  admin: adminReducer,
  bus: busReducer,
  routeAdmin: routeAdminReducer,
  ticketAdmin: ticketAdminReducer,
  booking: bookingReducer,
});