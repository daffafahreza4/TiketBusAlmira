const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Buat transporter
  const transporter = nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Definisikan opsi email
  const mailOptions = {
    from: `${process.env.EMAIL_FROM} <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Kirim email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;