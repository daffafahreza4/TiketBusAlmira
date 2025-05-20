import React from 'react';
import { connect } from 'react-redux';
import Login from '../components/auth/Login';
import Alert from '../components/layout/Alert';

const LoginPage = ({ auth }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-6">
        <Alert />
        <Login />
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(LoginPage);