const nodemailer = require("nodemailer");

/**
 * Sends a registration verification OTP code email.
 * @param {string} email - Recipient email
 * @param {string} otp - The 6-digit verification code
 */
const sendOtpEmail = async (email, otp) => {
    // ✅ FIXED: Configured with explicit host, port 587, and IPv4 forcing to bypass Render's network blocks
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000, 
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dns: {
            family: 4 // ✅ CRITICAL: Forces Node.js to use IPv4 instead of failing on IPv6 (ENETUNREACH)
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        }
    });

    const mailOptions = {
        from: '"SmartDesk AI Verification" <no-reply@smartdesk.com>',
        to: email,
        subject: `Your Registration Verification Code: ${otp}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #2563eb; padding: 20px; color: white; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Verify Your Identity</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <p style="font-size: 16px; text-align: left;">Hello,</p>
                    <p style="font-size: 16px; text-align: left;">Thank you for registering at SmartDesk AI. Use the verification code below to complete your registration request:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 30px auto; max-width: 200px; border: 1px dashed #2563eb;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
                    </div>
                    
                    <p style="font-size: 13px; color: #64748b; text-align: left;">⏳ Note: This verification window expires in **5 minutes**. If you did not make this request, please ignore this message securely.</p>
                </div>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    This is an automated security message. Please do not reply directly to this mail.
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("📧 OTP Security Mail Sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending OTP email:", error);
        throw error; 
    }
};

/**
 * Sends a confirmation email when a ticket is created.
 * @param {string} email - Recipient email
 * @param {object} ticket - The saved ticket object
 */
const sendTicketEmail = async (email, ticket) => {
    // ✅ FIXED: Configured with explicit host, port 587, and IPv4 forcing to bypass Render's network blocks
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000, 
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dns: {
            family: 4 // ✅ CRITICAL: Forces Node.js to use IPv4 instead of failing on IPv6 (ENETUNREACH)
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        }
    });

    // Verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            console.error("❌ Mailer Connection Error:", error);
        } else {
            console.log("✅ Mailer is ready to send emails");
        }
    });

    const ticketNo = `#${ticket._id.toString().slice(-6).toUpperCase()}`;

    const mailOptions = {
        from: '"SmartDesk AI Support" <no-reply@smartdesk.com>',
        to: email,
        subject: `Ticket Logged: ${ticketNo} - ${ticket.title}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background: #2563eb; padding: 20px; color: white; text-align: center;">
                    <h1 style="margin: 0;">Ticket Confirmation</h1>
                </div>
                <div style="padding: 30px;">
                    <p>Hello,</p>
                    <p>Your support ticket has been successfully created. Our team has been notified and will review it shortly.</p>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> <span style="color: #2563eb;">${ticketNo}</span></p>
                        <p style="margin: 5px 0;"><strong>Issue:</strong> ${ticket.title}</p>
                        <p style="margin: 5px 0;"><strong>Category:</strong> ${ticket.category}</p>
                        <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="color: ${ticket.priority === 'P1' ? '#ef4444' : '#f59e0b'}; font-weight: bold;">${ticket.priority}</span></p>
                    </div>
                    <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Summary & Troubleshooting Steps</h3>
                    <p style="white-space: pre-wrap; font-style: italic; color: #475569;">${ticket.aiSummary}</p>
                    <p style="margin-top: 30px;">You can track your progress via the <a href="${process.env.FRONTEND_URL}/tickets" style="color: #2563eb; text-decoration: none; font-weight: bold;">User Dashboard</a>.</p>
                </div>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    This is an automated message. Please do not reply to this email.
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Email sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending ticket email:", error);
    }
};

module.exports = { sendTicketEmail, sendOtpEmail };