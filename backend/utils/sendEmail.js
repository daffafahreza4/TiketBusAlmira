const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Buat transporter dengan method yang benar
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Definisikan opsi email
  const mailOptions = {
    from: `${process.env.EMAIL_FROM || 'TicketBus'} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Kirim email
  await transporter.sendMail(mailOptions);
};

// Send OTP verification email
const sendVerificationOTP = async (email, username, otp) => {
  const subject = 'Verifikasi Akun Almira Travel - Kode OTP';
  
  const message = `
Halo ${username},

Terima kasih telah mendaftar di Almira Travel!

Kode verifikasi OTP Anda adalah: ${otp}

Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun.

Jika Anda tidak merasa mendaftar di Almira Travel, abaikan email ini.

Salam,
Tim Almira Travel
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verifikasi Akun Almira Travel</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 Almira Travel</h1>
            <p>Verifikasi Akun Anda</p>
        </div>
        <div class="content">
            <h2>Halo ${username}!</h2>
            <p>Terima kasih telah mendaftar di Almira Travel. Untuk melengkapi proses pendaftaran, silakan verifikasi akun Anda dengan memasukkan kode OTP berikut:</p>
            
            <div class="otp-box">
                <p style="margin: 0; color: #6b7280;">Kode Verifikasi OTP</p>
                <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Penting:</strong>
                <ul style="margin: 10px 0;">
                    <li>Kode ini berlaku selama <strong>10 menit</strong></li>
                    <li>Jangan bagikan kode ini kepada siapa pun</li>
                    <li>Jika Anda tidak merasa mendaftar, abaikan email ini</li>
                </ul>
            </div>
            
            <p>Setelah verifikasi berhasil, Anda dapat langsung login dan menikmati layanan pemesanan tiket bus kami.</p>
            
            <p>Salam hangat,<br><strong>Tim Almira Travel</strong></p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    email,
    subject,
    message,
    html
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, resetUrl) => {
  const subject = 'Reset Password Almira Travel';
  
  const message = `
Halo ${username},

Kami menerima permintaan untuk reset password akun Almira Travel Anda.

Klik tombol Reset Password di email untuk membuat password baru. Link ini berlaku selama 10 menit.

Jika Anda tidak meminta reset password, abaikan email ini.

Salam,
Tim Almira Travel
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Password Almira Travel</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto;
            background: #f5f5f5;
        }
        .container { 
            background: #ffffff; 
            margin: 20px auto;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 {
            color: #1f2937;
            margin-top: 0;
            font-size: 24px;
        }
        .content p {
            color: #4b5563;
            font-size: 16px;
            margin: 16px 0;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white !important; 
            padding: 16px 40px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(239, 68, 68, 0.4);
        }
        .warning { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 0 8px 8px 0;
        }
        .warning strong {
            color: #92400e;
        }
        .warning ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .warning li {
            color: #92400e;
            margin: 8px 0;
        }
        .footer { 
            background: #f9fafb;
            text-align: center; 
            color: #6b7280; 
            font-size: 12px; 
            padding: 25px 30px;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 Almira Travel</h1>
            <p>Reset Password Akun Anda</p>
        </div>
        <div class="content">
            <h2>Halo ${username}!</h2>
            <p>Kami menerima permintaan untuk reset password akun Almira Travel Anda.</p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Penting:</strong>
                <ul>
                    <li>Link ini berlaku selama <strong>10 menit</strong></li>
                    <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                    <li>Password lama Anda tetap aman sampai Anda membuat yang baru</li>
                </ul>
            </div>
            
            <p>Terima kasih telah menggunakan layanan Almira Travel.</p>
            
            <p>Salam,<br><strong>Tim Almira Travel</strong></p>
        </div>
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p>© 2024 Almira Travel. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;

  await sendEmail({
    email,
    subject,
    message,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationOTP,
  sendPasswordResetEmail
};