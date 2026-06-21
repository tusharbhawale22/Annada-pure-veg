/**
 * config/email.js — Email service configuration using Nodemailer
 */

const nodemailer = require('nodemailer');

/**
 * Sends an email using configured SMTP environment variables or Ethereal fallback.
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML rendered content
 * @returns {Promise<string|null>} - Returns Ethereal preview URL if Ethereal sandbox is used
 */
const sendEmail = async (options) => {
  let transporter;
  let isSandbox = false;

  // Determine if a real custom SMTP configuration is provided
  const hasRealSmtp = 
    process.env.EMAIL_HOST && 
    process.env.EMAIL_USER && 
    process.env.EMAIL_USER.trim() !== '' &&
    process.env.EMAIL_USER.trim() !== 'your-email@gmail.com' &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_PASS.trim() !== '' &&
    process.env.EMAIL_PASS.trim() !== 'your-gmail-app-password';

  if (hasRealSmtp) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Annada Pure Veg" <noreply@annadapureveg.com>',
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await transporter.sendMail(mailOptions);
      return null; // Sent successfully via custom SMTP
    } catch (err) {
      console.warn('⚠️ SMTP configuration failed to send email, falling back to Ethereal sandbox. Error:', err.message);
      transporter = null;
    }
  }

  // Fallback to Ethereal Sandbox if SMTP is disabled, uses placeholders, or failed to send
  isSandbox = true;
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const mailOptions = {
    from: '"Annada Pure Veg (Sandbox)" <noreply@ethereal.email>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log('\n========================================');
  console.log('✉️  SANDBOX EMAIL DELIVERED (ETHEREAL)');
  console.log(`To:          ${options.email}`);
  console.log(`Subject:     ${options.subject}`);
  console.log(`Preview URL: ${previewUrl}`);
  console.log('========================================\n');

  return previewUrl;
};

module.exports = sendEmail;
