const fs = require('fs');
const path = require('path');

/**
 * Webhook Logger for Midtrans payment notifications
 * Logs all webhook events for debugging and monitoring
 */
class WebhookLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.webhookLogFile = path.join(this.logsDir, 'webhook.log');
    this.paymentLogFile = path.join(this.logsDir, 'payment.log');
    this.errorLogFile = path.join(this.logsDir, 'error.log');
    
    // Ensure logs directory exists
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log entry
   */
  formatLogEntry(level, message, data = null) {
    const entry = {
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      message,
      data: data || undefined
    };
    
    return JSON.stringify(entry) + '\n';
  }

  /**
   * Write to log file
   */
  writeToFile(filename, content) {
    try {
      fs.appendFileSync(filename, content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log webhook received event
   */
  logWebhookReceived(notification) {
    const logEntry = this.formatLogEntry('INFO', 'Webhook notification received', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      payment_type: notification.payment_type,
      fraud_status: notification.fraud_status,
      gross_amount: notification.gross_amount
    });

    this.writeToFile(this.webhookLogFile, logEntry);
    console.log('Webhook notification received:', notification.order_id);
  }

  /**
   * Log webhook processing success
   */
  logWebhookSuccess(orderId, oldStatus, newStatus) {
    const logEntry = this.formatLogEntry('SUCCESS', 'Webhook processed successfully', {
      order_id: orderId,
      status_change: `${oldStatus} → ${newStatus}`,
      processed_at: this.getTimestamp()
    });

    this.writeToFile(this.webhookLogFile, logEntry);
    this.writeToFile(this.paymentLogFile, logEntry);
    console.log('Webhook processed successfully:', orderId);
  }

  /**
   * Log webhook processing error
   */
  logWebhookError(orderId, error, notification = null) {
    const logEntry = this.formatLogEntry('ERROR', 'Webhook processing failed', {
      order_id: orderId,
      error: error.message,
      stack: error.stack,
      notification: notification || undefined
    });

    this.writeToFile(this.webhookLogFile, logEntry);
    this.writeToFile(this.errorLogFile, logEntry);
    console.error('Webhook processing failed:', orderId, error.message);
  }

  /**
   * Log invalid signature
   */
  logInvalidSignature(orderId, providedSignature, expectedSignature) {
    const logEntry = this.formatLogEntry('SECURITY', 'Invalid webhook signature', {
      order_id: orderId,
      provided_signature: providedSignature?.substring(0, 20) + '...',
      expected_signature: expectedSignature?.substring(0, 20) + '...',
      security_alert: true
    });

    this.writeToFile(this.webhookLogFile, logEntry);
    this.writeToFile(this.errorLogFile, logEntry);
    console.error('Invalid webhook signature for:', orderId);
  }

  /**
   * Log payment status change
   */
  logPaymentStatusChange(ticketId, orderId, oldStatus, newStatus, paymentType = null) {
    const logEntry = this.formatLogEntry('PAYMENT', 'Payment status changed', {
      ticket_id: ticketId,
      order_id: orderId,
      status_change: `${oldStatus} → ${newStatus}`,
      payment_type: paymentType,
      changed_at: this.getTimestamp()
    });

    this.writeToFile(this.paymentLogFile, logEntry);
    console.log(`Payment status changed: ${orderId} (${oldStatus} → ${newStatus})`);
  }

  /**
   * Log payment timeout
   */
  logPaymentTimeout(ticketId, orderId, timeoutDuration) {
    const logEntry = this.formatLogEntry('TIMEOUT', 'Payment timed out', {
      ticket_id: ticketId,
      order_id: orderId,
      timeout_duration: timeoutDuration,
      timed_out_at: this.getTimestamp()
    });

    this.writeToFile(this.paymentLogFile, logEntry);
    this.writeToFile(this.errorLogFile, logEntry);
    console.warn('Payment timeout:', orderId);
  }

  /**
   * Log successful payment completion
   */
  logPaymentCompleted(ticketId, orderId, amount, paymentType) {
    const logEntry = this.formatLogEntry('SUCCESS', 'Payment completed successfully', {
      ticket_id: ticketId,
      order_id: orderId,
      amount: amount,
      payment_type: paymentType,
      completed_at: this.getTimestamp()
    });

    this.writeToFile(this.paymentLogFile, logEntry);
    console.log('Payment completed successfully:', orderId);
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(days = 7) {
    try {
      if (!fs.existsSync(this.webhookLogFile)) {
        return { error: 'No webhook log file found' };
      }

      const logContent = fs.readFileSync(this.webhookLogFile, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentLogs = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log && new Date(log.timestamp) > cutoffDate);

      const stats = {
        total_webhooks: recentLogs.length,
        successful: recentLogs.filter(log => log.level === 'SUCCESS').length,
        errors: recentLogs.filter(log => log.level === 'ERROR').length,
        security_alerts: recentLogs.filter(log => log.level === 'SECURITY').length,
        period_days: days,
        latest_webhook: recentLogs.length > 0 ? recentLogs[recentLogs.length - 1].timestamp : null
      };

      return stats;
    } catch (error) {
      return { error: 'Failed to read webhook statistics' };
    }
  }

  /**
   * Get recent webhook events
   */
  getRecentWebhooks(limit = 50) {
    try {
      if (!fs.existsSync(this.webhookLogFile)) {
        return [];
      }

      const logContent = fs.readFileSync(this.webhookLogFile, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line);
      
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log)
        .reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to read recent webhooks:', error);
      return [];
    }
  }

  /**
   * Clean old logs (older than specified days)
   */
  cleanOldLogs(days = 30) {
    const logFiles = [this.webhookLogFile, this.paymentLogFile, this.errorLogFile];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    logFiles.forEach(logFile => {
      try {
        if (!fs.existsSync(logFile)) return;

        const logContent = fs.readFileSync(logFile, 'utf8');
        const lines = logContent.trim().split('\n').filter(line => line);
        
        const filteredLines = lines.filter(line => {
          try {
            const log = JSON.parse(line);
            return new Date(log.timestamp) > cutoffDate;
          } catch {
            return false;
          }
        });

        fs.writeFileSync(logFile, filteredLines.join('\n') + '\n');
        console.log(`Cleaned old logs from ${path.basename(logFile)}`);
      } catch (error) {
        console.error(`Failed to clean ${logFile}:`, error);
      }
    });
  }
}

// Create singleton instance
const webhookLogger = new WebhookLogger();

module.exports = webhookLogger;