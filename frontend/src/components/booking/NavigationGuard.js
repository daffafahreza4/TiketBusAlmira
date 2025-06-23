import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * NavigationGuard - Component untuk menangani navigasi kembali dengan konfirmasi
 * dan cleanup reservasi
 */
const NavigationGuard = ({ 
  children, 
  onBeforeLeave, 
  shouldWarn = true, 
  warningMessage = "Anda akan kehilangan reservasi kursi yang sudah dipilih. Lanjutkan?",
  routeId = null 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle browser back button
    const handlePopState = (event) => {
      if (shouldWarn) {
        const shouldLeave = window.confirm(warningMessage);
        
        if (shouldLeave) {
          // Call cleanup function if provided
          if (onBeforeLeave) {
            onBeforeLeave();
          }
          
          // Add URL parameter to indicate cancellation should happen
          const currentPath = location.pathname;
          const searchParams = new URLSearchParams();
          searchParams.set('cancel', 'true');
          searchParams.set('from', 'booking');
          
          // Navigate back with cancel parameter
          window.history.replaceState(null, '', `${currentPath}?${searchParams.toString()}`);
        } else {
          // Prevent navigation by pushing current state again
          window.history.pushState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    // Add popstate listener
    window.addEventListener('popstate', handlePopState);

    // Push current state to enable back detection
    window.history.pushState(null, '', window.location.pathname + window.location.search);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldWarn, warningMessage, onBeforeLeave, location.pathname]);

  // Handle page unload (refresh/close tab)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (shouldWarn && onBeforeLeave) {
        // Set flag for cleanup on next visit
        try {
          sessionStorage.setItem('shouldCancelReservations', 'true');
          if (routeId) {
            sessionStorage.setItem('cancelRouteId', routeId);
          }
        } catch (error) {
          console.warn('Could not set cleanup flag:', error);
        }
        
        // Modern browsers might not show custom message
        event.preventDefault();
        event.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldWarn, warningMessage, onBeforeLeave, routeId]);

  return <>{children}</>;
};

NavigationGuard.propTypes = {
  children: PropTypes.node.isRequired,
  onBeforeLeave: PropTypes.func,
  shouldWarn: PropTypes.bool,
  warningMessage: PropTypes.string,
  routeId: PropTypes.string
};

export default NavigationGuard;