import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';

// Import dashboard styles
import '../styles/Dashboard.css';

// Dashboard widgets
import UpcomingTicketsWidget from '../components/dashboard/UpcomingTicketsWidget';
import RecentTicketsWidget from '../components/dashboard/RecentTicketsWidget';
import PaymentStatusWidget from '../components/dashboard/PaymentStatusWidget';


// Actions
import { getUserTickets } from '../redux/actions/tiketActions';

const DashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  tiket: { tickets, loading: ticketLoading },
  getUserTickets
}) => {
  // Fetch user tickets when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      getUserTickets();
    }
  }, [getUserTickets, isAuthenticated]);

  // Redirect if not authenticated
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // Calculate if we're loading anything
  const isLoading = authLoading || ticketLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        {/* Main content area */}
        <main className="flex-1 ml-0 md:ml-64 pt-16 pb-0">
          <div className="p-6 min-h-full">
            <Alert />
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Selamat datang kembali, {user?.username || 'User'}!
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6 pb-8">  
                {/* Row 1: Three equal columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <PaymentStatusWidget 
                      tickets={tickets || []} 
                      loading={isLoading} 
                    />
                  </div>
                  <div>
                    <UpcomingTicketsWidget 
                      tickets={tickets || []} 
                      loading={isLoading} 
                    />
                  </div>
                </div>
                
                {/* Row 2: Recent Tickets - Full width */}
                <div>
                  <RecentTicketsWidget 
                    tickets={tickets || []} 
                    loading={isLoading} 
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Footer positioned properly */}
      <div className="ml-0 md:ml-64">
        <Footer />
      </div>
    </div>
  );
};

DashboardPage.propTypes = {
  auth: PropTypes.object.isRequired,
  tiket: PropTypes.object.isRequired,
  getUserTickets: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  tiket: state.tiket
});

export default connect(mapStateToProps, { getUserTickets })(DashboardPage);