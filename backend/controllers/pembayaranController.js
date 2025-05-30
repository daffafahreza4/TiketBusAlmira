const { Tiket, User, Rute, Bus, Pembayaran } = require('../models');
const { snap, core, config } = require('../config/midtrans');
const { sequelize } = require('../config/db');
const crypto = require('crypto');

// Create payment token (Snap Token)
exports.createPaymentToken = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id_tiket } = req.body;

    // Get ticket with related data
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

    // Check payment deadline
    if (new Date() > ticket.batas_pembayaran) {
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
    
    // Prepare payment parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseInt(ticket.total_bayar)
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        first_name: ticket.User.username,
        email: ticket.User.email,
        phone: ticket.User.no_telepon || '08123456789'
      },
      item_details: [
        {
          id: `TICKET-${ticket.id_tiket}`,
          price: parseInt(ticket.total_bayar),
          quantity: 1,
          name: `Tiket Bus ${ticket.Rute.asal} → ${ticket.Rute.tujuan}`,
          brand: 'Almira Bus',
          category: 'Transportation',
          merchant_name: 'Tiket Bus Almira'
        }
      ],
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/finish`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      custom_field1: `SEAT-${ticket.nomor_kursi}`,
      custom_field2: ticket.Rute.Bus.nama_bus,
      custom_field3: new Date(ticket.Rute.waktu_berangkat).toISOString()
    };

    // Create transaction with Midtrans
    const snapTransaction = await snap.createTransaction(parameter);

    // Update payment record
    if (ticket.Pembayaran) {
      ticket.Pembayaran.transaction_id = orderId;
      ticket.Pembayaran.payment_token = snapTransaction.token;
      ticket.Pembayaran.snap_redirect_url = snapTransaction.redirect_url;
      await ticket.Pembayaran.save({ transaction });
    } else {
      // Create new payment record if doesn't exist
      await Pembayaran.create({
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

    res.status(200).json({
      success: true,
      message: 'Token pembayaran berhasil dibuat',
      data: {
        snap_token: snapTransaction.token,
        redirect_url: snapTransaction.redirect_url,
        order_id: orderId,
        amount: ticket.total_bayar,
        ticket: {
          id: ticket.id_tiket,
          seat: ticket.nomor_kursi,
          route: `${ticket.Rute.asal} → ${ticket.Rute.tujuan}`,
          departure: ticket.Rute.waktu_berangkat,
          bus: ticket.Rute.Bus.nama_bus
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create payment token error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat token pembayaran',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Handle Midtrans webhook notification
exports.handleNotification = async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log('📨 [Midtrans Webhook] Received notification:', {
      orderId,
      transactionStatus,
      fraudStatus,
      paymentType: notification.payment_type
    });

    // Verify notification authenticity
    const hash = crypto
      .createHash('sha512')
      .update(orderId + notification.status_code + notification.gross_amount + config.serverKey)
      .digest('hex');

    if (hash !== notification.signature_key) {
      console.error('❌ [Midtrans Webhook] Invalid signature');
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
      console.error('❌ [Midtrans Webhook] Payment not found for order:', orderId);
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

    // Update payment record
    payment.status = newPaymentStatus;
    payment.waktu_pembayaran = new Date();
    payment.response_midtrans = JSON.stringify(notification);
    await payment.save();

    // Update ticket status
    const ticket = payment.Tiket;
    ticket.status_tiket = newTicketStatus;
    await ticket.save();

    console.log('✅ [Midtrans Webhook] Updated payment and ticket status:', {
      orderId,
      paymentStatus: newPaymentStatus,
      ticketStatus: newTicketStatus
    });

    // TODO: Send email confirmation if payment completed
    if (newPaymentStatus === 'completed') {
      console.log('🎫 [Midtrans Webhook] Payment completed, should send confirmation email');
      // This will be implemented in Task 3
    }

    res.status(200).json({
      success: true,
      message: 'Notification processed successfully'
    });

  } catch (error) {
    console.error('❌ [Midtrans Webhook] Error processing notification:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error processing notification'
    });
  }
};

// Check payment status
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
              model: Rute,
              attributes: ['asal', 'tujuan', 'waktu_berangkat']
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

    // Check status with Midtrans if transaction exists
    let midtransStatus = null;
    if (payment.transaction_id) {
      try {
        const statusResponse = await core.transaction.status(payment.transaction_id);
        midtransStatus = statusResponse;
      } catch (midtransError) {
        console.warn('⚠️ Could not fetch status from Midtrans:', midtransError.message);
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
        midtrans_status: midtransStatus
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
        console.warn('⚠️ Could not cancel transaction in Midtrans:', midtransError.message);
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