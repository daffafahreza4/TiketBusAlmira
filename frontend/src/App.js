import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import setAuthToken from './utils/setAuthToken';
import { loadUser } from './redux/actions/authActions';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyAccountPage from './pages/VerifyAccountPage';
import ProfilePage from './pages/ProfilePage';
import SearchResultsPage from './pages/SearchResultsPage';
import BookingPage from './pages/BookingPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import PrintTiket from './components/tiket/PrintTiket';

// Routing utilitity
import PrivateRoute from './components/routing/PrivateRoute';

// Cek token di local storage
if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify/:token" element={<VerifyAccountPage />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <PrivateRoute>
                <BookingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/booking/details/:id"
            element={
              <PrivateRoute>
                <BookingDetailsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <PrivateRoute>
                <MyTicketsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket/:id"
            element={
              <PrivateRoute>
                <TicketDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket/print/:id"
            element={
              <PrivateRoute>
                <PrintTiket />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;