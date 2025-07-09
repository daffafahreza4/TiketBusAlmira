import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Alert from '../components/layout/Alert';
import Spinner from '../components/layout/Spinner';
import '../styles/Dashboard.css';
import UpcomingTicketsWidget from '../components/dashboard/UpcomingTicketsWidget';
import RecentTicketsWidget from '../components/dashboard/RecentTicketsWidget';
import PaymentStatusWidget from '../components/dashboard/PaymentStatusWidget';
import { getUserTickets } from '../redux/actions/tiketActions';

const DashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  tickets,
  ticketLoading,
  ticketError,
  getUserTickets
}) => {
  // Fetch user tickets when component mounts
  useEffect(() => {
    if (isAuthenticated) getUserTickets();
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
            
            {/* Show error if tickets failed to load */}
            {ticketError && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Error loading tickets:</p>
                <p className="text-sm">{ticketError}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-6 pb-8">  
                {/* Row 1: Three equal columns */}
                  <div>
                    <PaymentStatusWidget 
                      tickets={tickets || []} 
                      loading={isLoading} 
                    />
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
      
      <div className="ml-0 md:ml-64">
        <Footer />
      </div>
    </div>
  );
};

DashboardPage.propTypes = {
  auth: PropTypes.object.isRequired,
  tickets: PropTypes.array,
  ticketLoading: PropTypes.bool,
  ticketError: PropTypes.string,
  getUserTickets: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth,
  tickets: state.tiket.tickets || [],
  ticketLoading: state.tiket.loading || false,
  ticketError: state.tiket.error || null
});

export default connect(mapStateToProps, { getUserTickets })(DashboardPage);