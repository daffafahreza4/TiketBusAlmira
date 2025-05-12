import React from 'react';
import ResetPassword from '../components/auth/ResetPassword';
import Alert from '../components/layout/Alert';

const ResetPasswordPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <ResetPassword />
      </div>
    </div>
  );
};

export default ResetPasswordPage;