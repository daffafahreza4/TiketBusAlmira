import React from 'react';
import Register from '../components/auth/Register';
import Alert from '../components/layout/Alert';

const RegisterPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <Register />
      </div>
    </div>
  );
};

export default RegisterPage;