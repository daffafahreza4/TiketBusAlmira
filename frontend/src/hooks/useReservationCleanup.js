import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cancelReservation } from '../redux/actions/reservasiActions';
import { setAlert } from '../redux/actions/alertActions';

/**
 * Custom hook untuk menangani cleanup reservasi
 * @param {string} routeId - ID rute yang sedang aktif
 * @returns {Object} Object dengan function cleanup dan status
 */
const useReservationCleanup = (routeId) => {
  const dispatch = useDispatch();

  // Function untuk cancel semua reservasi user untuk route tertentu
  const cancelAllUserReservations = useCallback(async () => {
    if (!routeId) return false;

    try {
      console.log('🧹 Starting reservation cleanup for route:', routeId);
      
      // Get stored reservation IDs for this route
      const storedReservations = sessionStorage.getItem(`reservations_${routeId}`);
      
      if (storedReservations) {
        const reservationIds = JSON.parse(storedReservations);
        
        // Cancel each reservation
        const cancelPromises = reservationIds.map(async (reservationId) => {
          try {
            await dispatch(cancelReservation(reservationId));
            console.log(`✅ Cancelled reservation: ${reservationId}`);
            return { success: true, id: reservationId };
          } catch (error) {
            console.warn(`⚠️ Could not cancel reservation ${reservationId}:`, error);
            return { success: false, id: reservationId, error };
          }
        });
        
        const results = await Promise.allSettled(cancelPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        // Clear stored reservations
        sessionStorage.removeItem(`reservations_${routeId}`);
        
        console.log(`🧹 Cleanup completed: ${successCount}/${reservationIds.length} reservations cancelled`);
        
        if (successCount > 0) {
          dispatch(setAlert(`${successCount} reservasi telah dibatalkan`, 'info'));
        }
        
        return { success: true, cancelledCount: successCount, totalCount: reservationIds.length };
      } else {
        console.log('📝 No stored reservations found for route:', routeId);
        return { success: true, cancelledCount: 0, totalCount: 0 };
      }
    } catch (error) {
      console.error('❌ Error during reservation cleanup:', error);
      dispatch(setAlert('Gagal membatalkan beberapa reservasi', 'warning'));
      return { success: false, error };
    }
  }, [routeId, dispatch]);

  // Function untuk clear selected seats dari storage
  const clearSelectedSeats = useCallback(() => {
    try {
      sessionStorage.removeItem('selectedSeats');
      sessionStorage.removeItem('routeId');
      console.log('🧹 Cleared selected seats from storage');
    } catch (error) {
      console.warn('Could not clear selected seats:', error);
    }
  }, []);

  // Function untuk complete cleanup (reservations + seats)
  const performCompleteCleanup = useCallback(async () => {
    console.log('🔄 Performing complete cleanup...');
    
    // Cancel reservations
    const reservationResult = await cancelAllUserReservations();
    
    // Clear selected seats
    clearSelectedSeats();
    
    // Clear any cleanup flags
    try {
      sessionStorage.removeItem('shouldCancelReservations');
      sessionStorage.removeItem('cancelRouteId');
    } catch (error) {
      console.warn('Could not clear cleanup flags:', error);
    }
    
    return reservationResult;
  }, [cancelAllUserReservations, clearSelectedSeats]);

  // Check for cleanup flags on mount
  useEffect(() => {
    const checkCleanupFlags = async () => {
      try {
        const shouldCancel = sessionStorage.getItem('shouldCancelReservations');
        const flaggedRouteId = sessionStorage.getItem('cancelRouteId');
        
        if (shouldCancel === 'true' && (flaggedRouteId === routeId || !flaggedRouteId)) {
          console.log('🚨 Found cleanup flag - performing cleanup');
          await performCompleteCleanup();
        }
      } catch (error) {
        console.warn('Error checking cleanup flags:', error);
      }
    };

    if (routeId) {
      checkCleanupFlags();
    }
  }, [routeId, performCompleteCleanup]);

  // Store reservation IDs helper function
  const storeReservationIds = useCallback((reservationIds) => {
    if (!routeId || !Array.isArray(reservationIds)) return;
    
    try {
      sessionStorage.setItem(`reservations_${routeId}`, JSON.stringify(reservationIds));
      console.log(`📝 Stored ${reservationIds.length} reservation IDs for route:`, routeId);
    } catch (error) {
      console.warn('Could not store reservation IDs:', error);
    }
  }, [routeId]);

  // Get stored reservation IDs
  const getStoredReservationIds = useCallback(() => {
    if (!routeId) return [];
    
    try {
      const stored = sessionStorage.getItem(`reservations_${routeId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not get stored reservation IDs:', error);
      return [];
    }
  }, [routeId]);

  return {
    // Main cleanup functions
    cancelAllUserReservations,
    clearSelectedSeats,
    performCompleteCleanup,
    
    // Helper functions
    storeReservationIds,
    getStoredReservationIds,
    
    // Computed values
    hasStoredReservations: getStoredReservationIds().length > 0
  };
};

export default useReservationCleanup;