import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const Alert = ({ alerts = [] }) =>
  alerts.length > 0 &&
  alerts.map(alert => (
    <div key={alert.id} className={`alert alert-${alert.alertType} fade-in`}>
      {alert.alertType === 'success' && <i className="fas fa-check-circle mr-2"></i>}
      {alert.alertType === 'danger' && <i className="fas fa-exclamation-circle mr-2"></i>}
      {alert.alertType === 'warning' && <i className="fas fa-exclamation-triangle mr-2"></i>}
      {alert.alertType === 'info' && <i className="fas fa-info-circle mr-2"></i>}
      {alert.msg}
    </div>
  ));

Alert.propTypes = {
  alerts: PropTypes.array
};

const mapStateToProps = state => ({
  alerts: state.alert
});

export default connect(mapStateToProps)(Alert);