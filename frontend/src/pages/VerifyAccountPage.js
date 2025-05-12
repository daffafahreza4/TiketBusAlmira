import React from 'react';
import VerifyAccount from '../components/auth/VerifyAccount';
import Alert from '../components/layout/Alert';

const VerifyAccountPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <VerifyAccount />
      </div>
    </div>
  );
};

export default VerifyAccountPage;