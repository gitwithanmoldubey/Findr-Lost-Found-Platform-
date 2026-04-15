const nodemailer = require('nodemailer');
const { emitToUser } = require('./realtime');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined
});

async function sendEmail({ to, subject, text }) {
  if (!to || !process.env.SMTP_HOST) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@findr.local',
      to,
      subject,
      text
    });
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }
}

async function notifyUser({ userId, email, event, title, body, data = {} }) {
  emitToUser(userId, event, { title, body, data, createdAt: new Date().toISOString() });
  await sendEmail({
    to: email,
    subject: `[Findr] ${title}`,
    text: `${body}\n\n${JSON.stringify(data, null, 2)}`
  });
}

module.exports = {
  notifyUser
};
