import React from 'react';
import ForgotPassword from '../components/auth/ForgotPassword';
import Alert from '../components/layout/Alert';

const ForgotPasswordPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <ForgotPassword />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;