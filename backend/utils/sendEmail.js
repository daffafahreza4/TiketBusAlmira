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

Anda menerima email ini karena ada permintaan untuk reset password akun Almira Travel Anda.

Klik link berikut untuk reset password: ${resetUrl}

Link ini berlaku selama 10 menit. Jika Anda tidak meminta reset password, abaikan email ini.

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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 Almira Travel</h1>
            <p>Reset Password</p>
        </div>
        <div class="content">
            <h2>Halo ${username}!</h2>
            <p>Kami menerima permintaan untuk reset password akun Almira Travel Anda.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Penting:</strong>
                <ul style="margin: 10px 0;">
                    <li>Link ini berlaku selama <strong>10 menit</strong></li>
                    <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                    <li>Password lama Anda tetap aman sampai Anda membuat yang baru</li>
                </ul>
            </div>
            
            <p>Jika button di atas tidak berfungsi, copy dan paste link berikut ke browser Anda:</p>
            <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            
            <p>Salam,<br><strong>Tim Almira Travel</strong></p>
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

module.exports = {
  sendEmail,
  sendVerificationOTP,
  sendPasswordResetEmail
};