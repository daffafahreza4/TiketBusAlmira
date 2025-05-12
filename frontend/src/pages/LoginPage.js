import React from 'react';
import Login from '../components/auth/Login';
import Alert from '../components/layout/Alert';

const LoginPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;