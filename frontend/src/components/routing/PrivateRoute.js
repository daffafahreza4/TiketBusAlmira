import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Spinner from '../layout/Spinner';

const PrivateRoute = ({ 
  children, 
  auth: { isAuthenticated, loading, user },
  requiredRole = null 
}) => {
  const location = useLocation();
  
  // Show loading spinner while checking authentication
  if (loading) return <Spinner />;
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Get user role
  const userRole = user?.role;
  
  console.log('🔍 PrivateRoute Debug:', {
    userRole,
    requiredRole,
    currentPath: location.pathname,
    isAuthenticated,
    user: user ? { id: user.id_user, role: user.role, username: user.username } : null
  });
  
  // If no specific role required, redirect to appropriate dashboard based on user role
  if (!requiredRole) {
    if (userRole === 'super_admin') {
      return <Navigate to="/admin/super-dashboard" replace />;
    } else if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // For regular users, show the content (like profile, tickets, etc.)
    return children;
  }
  
  // Handle role-based access control
  if (requiredRole) {
    let hasAccess = false;
    
    // If requiredRole is an array, check if user role is in the array
    if (Array.isArray(requiredRole)) {
      hasAccess = requiredRole.includes(userRole);
    } 
    // If requiredRole is a string, check exact match
    else if (typeof requiredRole === 'string') {
      hasAccess = userRole === requiredRole;
    }
    
    // If user doesn't have access, redirect to their appropriate dashboard
    if (!hasAccess) {
      console.log('❌ Access denied. Redirecting based on user role...');
      
      if (userRole === 'super_admin') {
        return <Navigate to="/admin/super-dashboard" replace />;
      } else if (userRole === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }
  
  console.log('✅ Access granted');
  // Allow access if all checks pass
  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  auth: PropTypes.object.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ])
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(PrivateRoute);