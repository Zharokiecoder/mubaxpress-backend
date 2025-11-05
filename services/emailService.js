const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send welcome email
exports.sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Welcome to StudentMart! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to StudentMart!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${userName}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining StudentMart - Nigeria's #1 student marketplace!
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You can now:
          </p>
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li>Browse thousands of products</li>
            <li>Buy & sell with fellow students</li>
            <li>Chat directly with vendors</li>
            <li>Get great deals on campus items</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/products" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Start Shopping
            </a>
          </div>
          <p style="color: #999; font-size: 14px; margin-top: 30px; text-align: center;">
            Happy trading! 🛒<br>
            The StudentMart Team
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', userEmail);
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Send order confirmation email
exports.sendOrderConfirmation = async (userEmail, userName, order) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Order Confirmation - #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${userName}! 🎉</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your order has been confirmed and is being processed.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
            <p style="color: #666;"><strong>Order ID:</strong> ${order._id}</p>
            <p style="color: #666;"><strong>Total Amount:</strong> ₦${order.totalAmount.toLocaleString()}</p>
            <p style="color: #666;"><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">${order.paymentStatus}</span></p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You can contact the vendor through messages to arrange delivery.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/profile" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View My Orders
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Order confirmation sent to:', userEmail);
  } catch (error) {
    console.error('Email error:', error);
  }
};

// Send new message notification
exports.sendMessageNotification = async (recipientEmail, recipientName, senderName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `New message from ${senderName} 💬`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">New Message! 💬</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${recipientName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have a new message from <strong>${senderName}</strong> on StudentMart.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/messages" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Message
            </a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Message notification sent to:', recipientEmail);
  } catch (error) {
    console.error('Email error:', error);
  }
};