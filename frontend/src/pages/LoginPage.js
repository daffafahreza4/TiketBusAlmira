import React from 'react';
import { connect } from 'react-redux';
import Login from '../components/auth/Login';
import Alert from '../components/layout/Alert';

// Komponen debug untuk membantu tracking state
const DebugAuth = ({ auth }) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold text-yellow-300 mb-2">🐛 Auth Debug:</div>
      <div>isAuthenticated: <span className={auth.isAuthenticated ? 'text-green-300' : 'text-red-300'}>{String(auth.isAuthenticated)}</span></div>
      <div>loading: <span className={auth.loading ? 'text-yellow-300' : 'text-gray-300'}>{String(auth.loading)}</span></div>
      <div>token: <span className={auth.token ? 'text-green-300' : 'text-red-300'}>{auth.token ? 'exists' : 'null'}</span></div>
      <div>user: <span className={auth.user ? 'text-green-300' : 'text-red-300'}>{auth.user ? auth.user.username : 'null'}</span></div>
      <div>error: <span className={auth.error ? 'text-red-300' : 'text-gray-300'}>{auth.error || 'null'}</span></div>
    </div>
  );
};

const LoginPage = ({ auth }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <Login />
        <DebugAuth auth={auth} />
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(LoginPage);