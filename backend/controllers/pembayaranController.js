const { Tiket, User, Rute, Bus, Pembayaran } = require('../models');
const { snap, core, config } = require('../config/midtrans');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

// Create payment token (Snap Token)
exports.createPaymentToken = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id_tiket } = req.body;

    const ticket = await Tiket.findOne({
      where: {
        id_tiket,
        id_user: req.user.id_user
      },
      include: [
        {
          model: User,
          attributes: ['username', 'email', 'no_telepon']
        },
        {
          model: Rute,
          include: [
            {
              model: Bus,
              attributes: ['nama_bus']
            }
          ]
        },
        {
          model: Pembayaran
        }
      ],
      transaction
    });

    if (!ticket) {
      await transaction.rollback();
      console.log('Ticket not found - returning error');
      return res.status(404).json({
        success: false,
        message: 'Tiket tidak ditemukan'
      });
    }

    // Check if ticket is still pending payment
    if (ticket.status_tiket !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Tiket tidak dalam status pending pembayaran'
      });
    }

    // Check payment deadline - ONLY for pending tickets
    if (ticket.status_tiket === 'pending' && new Date() > ticket.batas_pembayaran) {
      // Update ticket status to expired
      ticket.status_tiket = 'expired';
      await ticket.save({ transaction });

      if (ticket.Pembayaran) {
        ticket.Pembayaran.status = 'expired';
        await ticket.Pembayaran.save({ transaction });
      }

      await transaction.commit();
      return res.status(410).json({
        success: false,
        message: 'Batas waktu pembayaran telah habis'
      });
    }

    // Generate order ID
    const orderId = `ORDER-${ticket.id_tiket}-${Date.now()}`;

    // PERBAIKAN: Get total amount for order (support grouped tickets)
    let totalAmount = parseInt(ticket.total_bayar);
    let orderSeats = [ticket.nomor_kursi];
    
    if (ticket.order_group_id && ticket.is_master_ticket && ticket.order_total_amount) {
      // NEW SYSTEM: Use order total amount for grouped tickets
      totalAmount = parseInt(ticket.order_total_amount);
      
      // Get all seats in the order
      const allTicketsInOrder = await Tiket.findAll({
        where: {
          order_group_id: ticket.order_group_id,
          id_user: req.user.id_user
        },
        attributes: ['nomor_kursi'],
        order: [['nomor_kursi', 'ASC']]
      });
      
      orderSeats = allTicketsInOrder.map(t => t.nomor_kursi);
    }

    // Prepare payment parameter dengan pembatasan metode pembayaran
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount
      },
      // HAPUS credit_card untuk disable kartu kredit
      // credit_card: {
      //   secure: true
      // },
      customer_details: {
        first_name: ticket.User.username,
        email: ticket.User.email,
        phone: ticket.User.no_telepon || '08123456789'
      },
      item_details: orderSeats.length > 1 ? [
        {
          id: `ORDER-${ticket.order_group_id || ticket.id_tiket}`,
          price: totalAmount,
          quantity: 1,
          name: `${orderSeats.length} Tiket ${ticket.Rute.asal}-${ticket.Rute.tujuan}`.substring(0, 50),
          brand: 'Almira Bus',
          category: 'Transportation',
          merchant_name: 'Tiket Bus Almira'
        }
      ] : [
        {
          id: `TICKET-${ticket.id_tiket}`,
          price: totalAmount,
          quantity: 1,
          name: `Tiket ${ticket.Rute.asal}-${ticket.Rute.tujuan} (${orderSeats[0]})`.substring(0, 50),
          brand: 'Almira Bus',
          category: 'Transportation',
          merchant_name: 'Tiket Bus Almira'
        }
      ],
      // TAMBAH: Konfigurasi metode pembayaran yang diizinkan
      enabled_payments: [
        'qris',       
        'gopay',        
        'shopeepay'     
        ,'bca_va'
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/finish`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/pembayaran/notification`, // IMPORTANT: nanti di server tak perlu NGROK
      custom_field1: `SEATS-${orderSeats.join(',')}`,
      custom_field2: ticket.Rute.Bus.nama_bus,
      custom_field3: new Date(ticket.Rute.waktu_berangkat).toISOString()
    };

    // Create transaction with Midtrans
    console.log('Creating Midtrans transaction with parameter:', JSON.stringify(parameter, null, 2));
    const snapTransaction = await snap.createTransaction(parameter);
    console.log('Midtrans response:', snapTransaction);

    // Validate response from Midtrans
    if (!snapTransaction.token || !snapTransaction.redirect_url) {
      throw new Error('Invalid response from Midtrans: missing token or redirect_url');
    }

    if (ticket.Pembayaran) {
      ticket.Pembayaran.transaction_id = orderId;
      ticket.Pembayaran.payment_token = snapTransaction.token;
      ticket.Pembayaran.snap_redirect_url = snapTransaction.redirect_url;
      await ticket.Pembayaran.save({ transaction });
    } else {
      const newPayment = await Pembayaran.create({
        id_tiket: ticket.id_tiket,
        metode: 'midtrans',
        status: 'pending',
        kode_pembayaran: orderId,
        transaction_id: orderId,
        payment_token: snapTransaction.token,
        snap_redirect_url: snapTransaction.redirect_url
      }, { transaction });
    }
    await transaction.commit();
    const responseData = {
      success: true,
      message: 'Token pembayaran berhasil dibuat',
      data: {
        snap_token: snapTransaction.token,
        redirect_url: snapTransaction.redirect_url,
        order_id: orderId,
        amount: totalAmount,
        order: {
          order_group_id: ticket.order_group_id || `SINGLE-${ticket.id_tiket}`,
          total_tickets: orderSeats.length,
          seats: orderSeats,
          master_ticket_id: ticket.id_tiket
        },
        ticket: {
          id: ticket.id_tiket,
          seat: orderSeats.length > 1 ? orderSeats.join(', ') : orderSeats[0],
          route: `${ticket.Rute.asal} → ${ticket.Rute.tujuan}`,
          departure: ticket.Rute.waktu_berangkat,
          bus: ticket.Rute.Bus.nama_bus
        }
      }
    };
    res.status(200).json(responseData);

  } catch (error) {
    console.log('=== ERROR OCCURRED ===');
    console.error('Create payment token error:', error);
    console.error('Error stack:', error.stack);

    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat token pembayaran',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle Midtrans webhook notification
exports.handleNotification = async (req, res) => {
  const webhookLogger = require('../utils/webhookLogger');

  try {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Log webhook received
    webhookLogger.logWebhookReceived(notification);

    // Verify notification authenticity
    const hash = crypto
      .createHash('sha512')
      .update(orderId + notification.status_code + notification.gross_amount + config.serverKey)
      .digest('hex');

    if (hash !== notification.signature_key) {
      webhookLogger.logInvalidSignature(orderId, notification.signature_key, hash);
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Find payment record
    const payment = await Pembayaran.findOne({
      where: {
        transaction_id: orderId
      },
      include: [
        {
          model: Tiket,
          include: [
            {
              model: User,
              attributes: ['username', 'email']
            },
            {
              model: Rute,
              attributes: ['asal', 'tujuan', 'waktu_berangkat']
            }
          ]
        }
      ]
    });

    if (!payment) {
      webhookLogger.logWebhookError(orderId, new Error('Payment not found'), notification);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment status based on transaction status
    let newPaymentStatus = 'pending';
    let newTicketStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        newPaymentStatus = 'challenge';
        newTicketStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        newPaymentStatus = 'completed';
        newTicketStatus = 'confirmed';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'completed';
      newTicketStatus = 'confirmed';
    } else if (transactionStatus === 'deny') {
      newPaymentStatus = 'failed';
      newTicketStatus = 'cancelled';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
      newPaymentStatus = 'cancelled';
      newTicketStatus = 'cancelled';
    } else if (transactionStatus === 'pending') {
      newPaymentStatus = 'pending';
      newTicketStatus = 'pending';
    }

    // Use transaction to ensure both payment and ticket are updated atomically
    const transaction = await sequelize.transaction();
    
    try {
      // Update payment record
      const oldPaymentStatus = payment.status;
      payment.status = newPaymentStatus;
      payment.waktu_pembayaran = new Date();
      payment.response_midtrans = JSON.stringify(notification);
      payment.payment_type = notification.payment_type;
      if (notification.va_numbers && notification.va_numbers[0]) {
        payment.va_number = notification.va_numbers[0].va_number;
        payment.bank = notification.va_numbers[0].bank;
      }
      await payment.save({ transaction });

      // Update ticket status - HANDLE GROUPED TICKETS
      const masterTicket = payment.Tiket;
      const oldTicketStatus = masterTicket.status_tiket;
      
      if (masterTicket.order_group_id) {
        // NEW SYSTEM: Update all tickets in the order group
        const updateResult = await Tiket.update(
          { 
            status_tiket: newTicketStatus 
          },
          {
            where: {
              order_group_id: masterTicket.order_group_id
            },
            transaction
          }
        );
        
        console.log(`Updated ${updateResult[0]} tickets in order group ${masterTicket.order_group_id} to status: ${newTicketStatus}`);
        
        // Also update the master ticket to ensure it's updated
        if (updateResult[0] === 0) {
          console.log(`Warning: No tickets were updated for order group ${masterTicket.order_group_id}, updating master ticket individually`);
          masterTicket.status_tiket = newTicketStatus;
          await masterTicket.save({ transaction });
        }
      } else {
        // LEGACY SYSTEM: Update single ticket
        masterTicket.status_tiket = newTicketStatus;
        await masterTicket.save({ transaction });
      }
      
      // Commit transaction
      await transaction.commit();
    
      // Log status changes
      webhookLogger.logPaymentStatusChange(
        masterTicket.id_tiket,
        orderId,
        oldPaymentStatus,
        newPaymentStatus,
        notification.payment_type
      );

      webhookLogger.logWebhookSuccess(orderId, oldTicketStatus, newTicketStatus);

      // Log successful payment completion
      if (newPaymentStatus === 'completed') {
        webhookLogger.logPaymentCompleted(
          masterTicket.id_tiket,
          orderId,
          notification.gross_amount,
          notification.payment_type
        );
      }

      // Send email confirmation if payment completed
      if (newPaymentStatus === 'completed') {
        try {
          const { sendPaymentConfirmation } = require('../utils/sendEmail');
          
          // Get all seats for email notification
          let allSeats = [masterTicket.nomor_kursi];
          if (masterTicket.order_group_id) {
            const allTicketsInOrder = await Tiket.findAll({
              where: {
                order_group_id: masterTicket.order_group_id,
                id_user: masterTicket.id_user
              },
              attributes: ['nomor_kursi'],
              order: [['nomor_kursi', 'ASC']]
            });
            allSeats = allTicketsInOrder.map(t => t.nomor_kursi);
          }
          
          const ticketData = {
            email: masterTicket.User.email,
            username: masterTicket.User.username,
            orderId: orderId,
            ticketId: masterTicket.id_tiket,
            seatNumber: allSeats.length > 1 ? allSeats.join(', ') : allSeats[0],
            totalTickets: allSeats.length,
            orderGroupId: masterTicket.order_group_id,
            route: {
              asal: masterTicket.Rute.asal,
              tujuan: masterTicket.Rute.tujuan
            },
            departureTime: masterTicket.Rute.waktu_berangkat,
            busName: masterTicket.Rute.Bus?.nama_bus || 'Bus Almira',
            amount: parseFloat(notification.gross_amount),
            paymentMethod: notification.payment_type || 'Midtrans',
            paymentTime: new Date()
          };
          
          await sendPaymentConfirmation(ticketData);
          console.log(`✅ Payment confirmation email sent successfully to: ${masterTicket.User.email} for ${allSeats.length} tickets`);
          
        } catch (emailError) {
          console.error('❌ Failed to send payment confirmation email:', emailError.message);
          // Don't fail the whole transaction if email fails
        }
      }

      res.status(200).json({
        success: true,
        message: 'Notification processed successfully'
      });
      
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    const webhookLogger = require('../utils/webhookLogger');
    webhookLogger.logWebhookError(req.body?.order_id || 'unknown', error, req.body);

    res.status(500).json({
      success: false,
      message: 'Error processing notification'
    });
  }
};

// Check payment status and sync with Midtrans
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { id_tiket } = req.params;

    // Get payment and ticket data
    const payment = await Pembayaran.findOne({
      where: {
        id_tiket
      },
      include: [
        {
          model: Tiket,
          where: {
            id_user: req.user.id_user
          },
          include: [
            {
              model: User,
              attributes: ['username', 'email']
            },
            {
              model: Rute,
              attributes: ['asal', 'tujuan', 'waktu_berangkat'],
              include: [
                {
                  model: Bus,
                  attributes: ['nama_bus']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan'
      });
    }

    // Check status with Midtrans if transaction exists and sync if needed
    let midtransStatus = null;
    let statusUpdated = false;
    
    if (payment.transaction_id && payment.status === 'pending') {
      try {
        const statusResponse = await core.transaction.status(payment.transaction_id);
        midtransStatus = statusResponse;
        
        // Update local status based on Midtrans response
        if (statusResponse.transaction_status === 'settlement' || 
            (statusResponse.transaction_status === 'capture' && statusResponse.fraud_status === 'accept')) {
          
          const transaction = await sequelize.transaction();
          try {
            // Update payment status
            payment.status = 'completed';
            payment.waktu_pembayaran = new Date();
            payment.response_midtrans = JSON.stringify(statusResponse);
            payment.payment_type = statusResponse.payment_type;
            await payment.save({ transaction });

            // Update ticket status
            payment.Tiket.status_tiket = 'confirmed';
            await payment.Tiket.save({ transaction });
            
            await transaction.commit();
            statusUpdated = true;
            
            console.log('=== STATUS SYNCHRONIZED ===');
            console.log('Payment status updated to: completed');
            console.log('Ticket status updated to: confirmed');
            
            // Send email confirmation for polling status update
            try {
              const { sendPaymentConfirmation } = require('../utils/sendEmail');
              
              const ticketData = {
                email: payment.Tiket.User.email,
                username: payment.Tiket.User.username,
                orderId: payment.transaction_id,
                ticketId: payment.Tiket.id_tiket,
                seatNumber: payment.Tiket.nomor_kursi,
                route: {
                  asal: payment.Tiket.Rute.asal,
                  tujuan: payment.Tiket.Rute.tujuan
                },
                departureTime: payment.Tiket.Rute.waktu_berangkat,
                busName: payment.Tiket.Rute.Bus?.nama_bus || 'Bus Almira',
                amount: parseFloat(statusResponse.gross_amount),
                paymentMethod: statusResponse.payment_type || 'Midtrans',
                paymentTime: new Date()
              };
              
              await sendPaymentConfirmation(ticketData);
              console.log('✅ Payment confirmation email sent via polling to:', payment.Tiket.User.email);
              
            } catch (emailError) {
              console.error('❌ Failed to send payment confirmation email via polling:', emailError.message);
            }
       
          } catch (updateError) {
            await transaction.rollback();
            console.error('Failed to update status:', updateError);
          }
        }
        
      } catch (midtransError) {
        console.warn('Could not fetch status from Midtrans:', midtransError.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        payment: {
          id: payment.id_pembayaran,
          status: payment.status,
          metode: payment.metode,
          transaction_id: payment.transaction_id,
          kode_pembayaran: payment.kode_pembayaran,
          waktu_pembayaran: payment.waktu_pembayaran
        },
        ticket: {
          id: payment.Tiket.id_tiket,
          status: payment.Tiket.status_tiket,
          nomor_kursi: payment.Tiket.nomor_kursi,
          total_bayar: payment.Tiket.total_bayar,
          batas_pembayaran: payment.Tiket.batas_pembayaran
        },
        route: payment.Tiket.Rute,
        midtrans_status: midtransStatus,
        status_updated: statusUpdated
      }
    });

  } catch (error) {
    console.error('Check payment status error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengecek status pembayaran'
    });
  }
};

// Cancel payment
exports.cancelPayment = async (req, res) => {
  try {
    const { id_tiket } = req.params;

    const payment = await Pembayaran.findOne({
      where: {
        id_tiket
      },
      include: [
        {
          model: Tiket,
          where: {
            id_user: req.user.id_user
          }
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Data pembayaran tidak ditemukan'
      });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran yang sudah selesai tidak dapat dibatalkan'
      });
    }

    // Cancel transaction in Midtrans if exists
    if (payment.transaction_id) {
      try {
        await core.transaction.cancel(payment.transaction_id);
      } catch (midtransError) {
        console.warn('Could not cancel transaction in Midtrans:', midtransError.message);
      }
    }

    // Update payment and ticket status
    payment.status = 'cancelled';
    await payment.save();

    const ticket = payment.Tiket;
    ticket.status_tiket = 'cancelled';
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil dibatalkan',
      data: {
        payment_id: payment.id_pembayaran,
        ticket_id: ticket.id_tiket
      }
    });

  } catch (error) {
    console.error('Cancel payment error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membatalkan pembayaran'
    });
  }
};

// Get payment methods (for frontend)
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = {
      credit_card: {
        name: 'Kartu Kredit/Debit',
        enabled: true,
        description: 'Visa, Mastercard, JCB'
      },
      bank_transfer: {
        name: 'Transfer Bank',
        enabled: true,
        banks: ['bca', 'bni', 'bri', 'permata'],
        description: 'Transfer melalui ATM, Mobile Banking, atau Internet Banking'
      },
      echannel: {
        name: 'Mandiri Bill Payment',
        enabled: true,
        description: 'Bayar melalui ATM Mandiri atau Mandiri Online'
      },
      bca_klikpay: {
        name: 'BCA KlikPay',
        enabled: false,
        description: 'Bayar menggunakan BCA KlikPay'
      },
      gopay: {
        name: 'GoPay',
        enabled: true,
        description: 'Bayar menggunakan aplikasi Gojek'
      },
      shopeepay: {
        name: 'ShopeePay',
        enabled: true,
        description: 'Bayar menggunakan ShopeePay'
      }
    };

    res.status(200).json({
      success: true,
      data: paymentMethods,
      environment: config.environment
    });

  } catch (error) {
    console.error('Get payment methods error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil metode pembayaran'
    });
  }
};

// Get webhook statistics (admin only)
exports.getWebhookStats = async (req, res) => {
  try {
    const webhookLogger = require('../utils/webhookLogger');
    const days = parseInt(req.query.days) || 7;

    const stats = webhookLogger.getWebhookStats(days);
    const recentWebhooks = webhookLogger.getRecentWebhooks(10);

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        recent_webhooks: recentWebhooks,
        midtrans_environment: config.environment
      }
    });

  } catch (error) {
    console.error('Get webhook stats error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik webhook'
    });
  }
};

// Manual webhook cleanup (admin only)
exports.cleanupWebhookLogs = async (req, res) => {
  try {
    const webhookLogger = require('../utils/webhookLogger');
    const days = parseInt(req.body.days) || 30;

    webhookLogger.cleanOldLogs(days);

    res.status(200).json({
      success: true,
      message: `Log lama (>${days} hari) berhasil dibersihkan`
    });

  } catch (error) {
    console.error('Cleanup webhook logs error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membersihkan log'
    });
  }
};