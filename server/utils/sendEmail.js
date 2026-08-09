const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.HOST || 'smtp.gmail.com',
    port: parseInt(process.env.PORT_MAIL || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTP = async (toEmail, otpCode) => {
  const transporter = createTransporter();

  const digits = otpCode.toString().split('');

  const mailOptions = {
    from: `"Pyramid App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${otpCode} is your Pyramid verification code`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your OTP Code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#09090b;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#ffffff;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;padding:6px;">
                    <span style="font-size:16px;">&#9650;</span>
                  </td>
                  <td style="padding-left:10px;color:#ffffff;font-size:1.1rem;font-weight:700;letter-spacing:-0.01em;vertical-align:middle;">
                    Pyramid
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 8px;font-size:0.8125rem;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">
                Verification Code
              </p>
              <h1 style="margin:0 0 16px;font-size:1.375rem;font-weight:700;color:#09090b;letter-spacing:-0.02em;">
                Your one-time login code
              </h1>
              <p style="margin:0 0 28px;font-size:0.9375rem;color:#52525b;line-height:1.6;">
                Use the code below to sign in to your Pyramid account. 
                Do <strong>not</strong> share this code with anyone.
              </p>

              <!-- OTP Boxes -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  ${digits.map(d => `
                  <td style="
                    width:44px;height:52px;
                    background:#f4f4f5;
                    border:2px solid #e4e4e7;
                    border-radius:10px;
                    text-align:center;
                    vertical-align:middle;
                    font-size:1.625rem;
                    font-weight:700;
                    color:#09090b;
                    letter-spacing:0;
                    margin:0 4px;
                    padding:0 6px;
                  ">${d}</td>
                  `).join('')}
                </tr>
              </table>




            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #e4e4e7;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:0.75rem;color:#a1a1aa;line-height:1.6;">
                This email was sent by <strong style="color:#71717a;">Pyramid App</strong>.<br/>
                &copy; ${new Date().getFullYear()} Pyramid. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendWelcomePassword = async (toEmail, userName, password) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Todo SaaS App" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Welcome to Todo SaaS - Your Account Password`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Todo SaaS</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:500px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#09090b;padding:28px 40px;text-align:center;">
              <h2 style="color:#ffffff;margin:0;font-size:1.25rem;font-weight:700;">Todo SaaS</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;font-size:1.375rem;font-weight:700;color:#09090b;">
                Welcome, ${userName || 'User'}! 🎉
              </h1>
              <p style="margin:0 0 20px;font-size:0.9375rem;color:#52525b;line-height:1.6;">
                Thank you for creating an account on <strong>Todo SaaS</strong> via Google Login.
              </p>
              <p style="margin:0 0 20px;font-size:0.9375rem;color:#52525b;line-height:1.6;">
                We have generated a secure password for your account so you can also log in directly using your email:
              </p>

              <!-- Password Card -->
              <div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:16px 20px;text-align:center;margin:0 0 24px;">
                <span style="display:block;font-size:0.75rem;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px;">Your Login Password</span>
                <span style="font-size:1.25rem;font-weight:700;color:#09090b;letter-spacing:1px;">${password}</span>
              </div>

              <p style="margin:0 0 10px;font-size:0.875rem;color:#71717a;line-height:1.5;">
                You can use your email (<strong>${toEmail}</strong>) and this password anytime to log in.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #e4e4e7;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:0.75rem;color:#a1a1aa;line-height:1.6;">
                This email was sent by <strong>Todo SaaS App</strong>.<br/>
                &copy; ${new Date().getFullYear()} Todo SaaS. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendWelcomePassword };
