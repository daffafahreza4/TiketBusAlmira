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
import AccountSummaryWidget from '../components/dashboard/AccountSummaryWidget';
import QuickSearchWidget from '../components/dashboard/QuickSearchWidget';
import UpcomingTicketsWidget from '../components/dashboard/UpcomingTicketsWidget';
import RecentTicketsWidget from '../components/dashboard/RecentTicketsWidget';
import PaymentStatusWidget from '../components/dashboard/PaymentStatusWidget';
import NotificationWidget from '../components/dashboard/NotificationWidget';

// Actions
import { getUserTickets } from '../redux/actions/tiketActions';

const DashboardPage = ({
  auth: { user, isAuthenticated, loading: authLoading },
  tiket: { tickets, loading: ticketLoading },
  getUserTickets
}) => {
  // PERBAIKAN: Pindahkan useEffect SEBELUM conditional return
  // Fetch user tickets when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      getUserTickets();
    }
  }, [getUserTickets, isAuthenticated]);

  // Redirect if not authenticated - SETELAH useEffect
  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" />;
  }

  // Calculate if we're loading anything
  const isLoading = authLoading || ticketLoading;

  return (
    <div className="dashboard-layout bg-gray-100">
      <Navbar />
      
      <div className="dashboard-content">
        <Sidebar />
        
        <div className="dashboard-main pt-20 pb-10 px-4 md:px-8">
          <Alert />
          
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          {isLoading ? (
            <div className="flex justify-center my-12">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Row 1 */}
              <div className="lg:col-span-2">
                <AccountSummaryWidget 
                  user={user} 
                  tickets={tickets || []} 
                  loading={isLoading} 
                />
              </div>
              
              <div>
                <QuickSearchWidget loading={ticketLoading} />
              </div>
              
              {/* Row 2 */}
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
              
              <div>
                <NotificationWidget loading={isLoading} />
              </div>
              
              {/* Row 3 */}
              <div className="lg:col-span-3">
                <RecentTicketsWidget 
                  tickets={tickets || []} 
                  loading={isLoading} 
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
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