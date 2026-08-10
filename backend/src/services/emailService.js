const { Resend } = require('resend');

// High-Speed Direct HTTPS CDN Logo (Guaranteed 200 image/png header for Gmail & webmail clients)
const DEFAULT_LOGO_URL = process.env.LOGO_URL || 'https://iili.io/C4yqztp.png';
const DEFAULT_LOGIN_URL = process.env.FRONTEND_URL || 'http://localhost:5173/login';

/**
 * Render Welcome Email HTML (Smaller Logo & Compact Spacing)
 */
function renderWelcomeEmailHtml({ fullName, role = 'User', toEmail, tempPassword, logoUrl = DEFAULT_LOGO_URL, loginUrl = DEFAULT_LOGIN_URL }) {
  const cleanRole = String(role).toUpperCase();
  const uniqueToken = `ST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return `
<div style="
  margin: 0;
  padding: 24px 12px;
  background-color: #f7f7f6;
  font-family: Arial, Helvetica, sans-serif;
  color: #1a1816;
">

  <div style="
    max-width: 520px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e5e3e1;
    border-radius: 8px;
    overflow: hidden;
  ">

    <!-- Brand Accent -->
    <div style="
      height: 5px;
      background-color: #155fd5;
    "></div>

    <!-- Main Content -->
    <div style="
      padding: 28px 32px 28px;
    ">

      <!-- Logo -->
      <div style="
        text-align: center;
        margin-bottom: 14px;
      ">
        <img
          src="${logoUrl}"
          alt="SalinTinig"
          width="110"
          style="
            display: inline-block;
            width: 110px;
            max-width: 60%;
            height: auto;
            border: 0;
            outline: none;
          "
        >
      </div>

      <!-- Heading -->
      <h1 style="
        margin: 0 0 24px;
        text-align: center;
        color: #1a1816;
        font-size: 26px;
        line-height: 1.25;
        font-weight: 700;
      ">
        Welcome to SalinTinig
      </h1>

      <!-- Greeting -->
      <p style="
        margin: 0 0 16px;
        font-size: 16px;
        line-height: 1.5;
        color: #353331;
      ">
        Hello <strong>${fullName}</strong>,
      </p>

      <!-- Introduction -->
      <p style="
        margin: 0 0 22px;
        font-size: 15px;
        line-height: 1.6;
        color: #53504d;
      ">
        Your <strong>${cleanRole}</strong> account for the
        SalinTinig Portal has been created. You can use
        the temporary credentials below to access your account.
      </p>

      <!-- Credentials Card -->
      <div style="
        margin: 0 0 24px;
        padding: 18px 20px;
        background-color: #fafafa;
        border: 1px solid #e5e3e1;
        border-radius: 6px;
      ">

        <!-- Email -->
        <p style="
          margin: 0 0 16px;
          font-size: 13px;
          color: #6b6865;
        ">
          <strong style="
            display: block;
            margin-bottom: 6px;
            color: #353331;
          ">
            Email
          </strong>

          <span style="
            display: block;
            padding: 9px 12px;
            background-color: #ffffff;
            border: 1px solid #d8d5d2;
            border-radius: 5px;
            color: #1a1816;
            font-size: 15px;
            word-break: break-word;
          ">
            ${toEmail}
          </span>
        </p>

        <!-- Temporary Password -->
        <p style="
          margin: 0;
          font-size: 13px;
          color: #6b6865;
        ">
          <strong style="
            display: block;
            margin-bottom: 6px;
            color: #353331;
          ">
            Temporary Password
          </strong>

          <span style="
            display: block;
            padding: 9px 12px;
            background-color: #ffffff;
            border: 1px solid #d8d5d2;
            border-radius: 5px;
            color: #155fd5;
            font-family: monospace;
            font-size: 16px;
            font-weight: 700;
          ">
            ${tempPassword}
          </span>
        </p>

      </div>

      <!-- Security Notice -->
      <div style="
        margin: 0 0 24px;
        padding: 12px 16px;
        background-color: #fff7f5;
        border-left: 3px solid #d53f24;
        border-radius: 0 4px 4px 0;
      ">
        <p style="
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #53504d;
        ">
          <strong style="color: #1a1816;">
            Important:
          </strong>
          Please change your temporary password after your first login.
          Do not share your password with anyone.
        </p>
      </div>

      <!-- Login Button -->
      <div style="
        text-align: center;
        margin: 26px 0 32px;
      ">
        <a
          href="${loginUrl}"
          style="
            display: inline-block;
            padding: 13px 30px;
            background-color: #155fd5;
            color: #ffffff;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
            border-radius: 5px;
          "
        >
          Log in to Your Account
        </a>
      </div>

      <!-- Closing -->
      <p style="
        margin: 0 0 22px;
        font-size: 13px;
        line-height: 1.6;
        color: #6b6865;
      ">
        If you did not expect to receive this email, please contact
        your school administrator.
      </p>

      <!-- Footer Divider -->
      <hr style="
        border: 0;
        border-top: 1px solid #e5e3e1;
        margin: 24px 0 18px 0;
      " />

      <!-- Footer Text inside content container -->
      <div style="text-align: center;">
        <p style="
          margin: 0;
          color: #9a9794;
          font-size: 12px;
          line-height: 1.6;
        ">
          This is an automated email from the SalinTinig Educational Portal.
        </p>

        <p style="
          margin: 4px 0 0;
          color: #9a9794;
          font-size: 12px;
        ">
          Please do not reply to this email.
        </p>
      </div>

    </div>

  </div>

  <!-- Anti-Gmail Trimming Hidden Unique Token -->
  <div style="display: none !important; visibility: hidden; opacity: 0; color: #f7f7f6; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; overflow: hidden;">
    [Ref: ${uniqueToken}]
  </div>

</div>
  `;
}

/**
 * Render New Teacher Account Request Email HTML
 */
function renderTeacherAccountRequestEmailHtml({ computedFullName, cleanTeacherNo, cleanSex, cleanEmail, cleanSchoolId, logoUrl = DEFAULT_LOGO_URL, loginUrl = DEFAULT_LOGIN_URL }) {
  const uniqueToken = `ST-REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return `
<div style="
  margin: 0;
  padding: 24px 12px;
  background-color: #f7f7f6;
  font-family: Arial, Helvetica, sans-serif;
  color: #1a1816;
">

  <div style="
    max-width: 520px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e5e3e1;
    border-radius: 8px;
    overflow: hidden;
  ">

    <!-- Brand Accent -->
    <div style="
      height: 5px;
      background-color: #155fd5;
    "></div>

    <!-- Main Content -->
    <div style="
      padding: 28px 32px 28px;
    ">

      <!-- Logo -->
      <div style="
        text-align: center;
        margin-bottom: 14px;
      ">
        <img
          src="${logoUrl}"
          alt="SalinTinig"
          width="110"
          style="
            display: inline-block;
            width: 110px;
            max-width: 60%;
            height: auto;
            border: 0;
            outline: none;
          "
        >
      </div>

      <!-- Heading -->
      <h1 style="
        margin: 0 0 24px;
        text-align: center;
        color: #1a1816;
        font-size: 26px;
        line-height: 1.25;
        font-weight: 700;
      ">
        New Teacher Account Request
      </h1>

      <!-- Intro Message -->
      <p style="
        margin: 0 0 22px;
        font-size: 15px;
        line-height: 1.6;
        color: #53504d;
      ">
        A teacher has submitted an account activation request for School ID <strong>${cleanSchoolId}</strong>:
      </p>

      <!-- Details Card -->
      <div style="
        margin: 0 0 24px;
        padding: 18px 20px;
        background-color: #fafafa;
        border: 1px solid #e5e3e1;
        border-radius: 6px;
      ">

        <!-- Full Name -->
        <p style="
          margin: 0 0 12px;
          font-size: 14px;
          color: #353331;
        ">
          <strong style="color: #1a1816;">Full Name:</strong> ${computedFullName}
        </p>

        <!-- Teacher ID -->
        <p style="
          margin: 0 0 12px;
          font-size: 14px;
          color: #353331;
        ">
          <strong style="color: #1a1816;">Teacher ID:</strong> ${cleanTeacherNo || 'N/A'}
        </p>

        <!-- Sex / Gender -->
        <p style="
          margin: 0 0 12px;
          font-size: 14px;
          color: #353331;
        ">
          <strong style="color: #1a1816;">Sex / Gender:</strong> ${cleanSex}
        </p>

        <!-- Email -->
        <p style="
          margin: 0;
          font-size: 14px;
          color: #353331;
        ">
          <strong style="color: #1a1816;">Email:</strong> <a href="mailto:${cleanEmail}" style="color: #155fd5; text-decoration: none;">${cleanEmail}</a>
        </p>

      </div>

      <!-- Action Note -->
      <p style="
        margin: 0 0 24px;
        font-size: 14px;
        line-height: 1.6;
        color: #53504d;
      ">
        Log in to your Admin Dashboard to review and approve this request.
      </p>

      <!-- Login Button -->
      <div style="
        text-align: center;
        margin: 24px 0 28px;
      ">
        <a
          href="${loginUrl}"
          style="
            display: inline-block;
            padding: 13px 30px;
            background-color: #155fd5;
            color: #ffffff;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
            border-radius: 5px;
          "
        >
          Review Request in Dashboard
        </a>
      </div>

      <!-- Footer Divider -->
      <hr style="
        border: 0;
        border-top: 1px solid #e5e3e1;
        margin: 24px 0 18px 0;
      " />

      <!-- Footer Text inside content container -->
      <div style="text-align: center;">
        <p style="
          margin: 0;
          color: #9a9794;
          font-size: 12px;
          line-height: 1.6;
        ">
          This is an automated email from the SalinTinig Educational Portal.
        </p>

        <p style="
          margin: 4px 0 0;
          color: #9a9794;
          font-size: 12px;
        ">
          Please do not reply to this email.
        </p>
      </div>

    </div>

  </div>

  <!-- Anti-Gmail Trimming Hidden Unique Token -->
  <div style="display: none !important; visibility: hidden; opacity: 0; color: #f7f7f6; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; overflow: hidden;">
    [Ref: ${uniqueToken}]
  </div>

</div>
  `;
}

/**
 * Render Password Reset Code Email HTML
 */
function renderPasswordResetEmailHtml({ fullName, toEmail, resetCode, logoUrl = DEFAULT_LOGO_URL }) {
  const uniqueToken = `ST-RESET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return `
<div style="
  margin: 0;
  padding: 24px 12px;
  background-color: #f7f7f6;
  font-family: Arial, Helvetica, sans-serif;
  color: #1a1816;
">

  <div style="
    max-width: 520px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e5e3e1;
    border-radius: 8px;
    overflow: hidden;
  ">

    <!-- Brand Accent -->
    <div style="
      height: 5px;
      background-color: #155fd5;
    "></div>

    <!-- Main Content -->
    <div style="
      padding: 28px 32px 28px;
    ">

      <!-- Logo -->
      <div style="
        text-align: center;
        margin-bottom: 14px;
      ">
        <img
          src="${logoUrl}"
          alt="SalinTinig"
          width="110"
          style="
            display: inline-block;
            width: 110px;
            max-width: 60%;
            height: auto;
            border: 0;
            outline: none;
          "
        >
      </div>

      <!-- Heading -->
      <h1 style="
        margin: 0 0 24px;
        text-align: center;
        color: #1a1816;
        font-size: 26px;
        line-height: 1.25;
        font-weight: 700;
      ">
        Password Reset Request
      </h1>

      <!-- Greeting -->
      <p style="
        margin: 0 0 16px;
        font-size: 16px;
        line-height: 1.5;
        color: #353331;
      ">
        Hello <strong>${fullName || toEmail}</strong>,
      </p>

      <!-- Introduction -->
      <p style="
        margin: 0 0 22px;
        font-size: 15px;
        line-height: 1.6;
        color: #53504d;
      ">
        We received a request to reset your password for your SalinTinig Portal account (${toEmail}). Use the 6-digit verification code below:
      </p>

      <!-- Code Box -->
      <div style="
        margin: 0 0 24px;
        padding: 22px 20px;
        background-color: #fafafa;
        border: 1px solid #e5e3e1;
        border-radius: 6px;
        text-align: center;
      ">
        <span style="
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6b6865;
          letter-spacing: 0.5px;
        ">
          Verification Code
        </span>

        <span style="
          font-family: monospace;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 10px;
          color: #155fd5;
          display: block;
        ">
          ${resetCode}
        </span>
      </div>

      <!-- Security Notice -->
      <div style="
        margin: 0 0 24px;
        padding: 12px 16px;
        background-color: #fff7f5;
        border-left: 3px solid #d53f24;
        border-radius: 0 4px 4px 0;
      ">
        <p style="
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #53504d;
        ">
          <strong style="color: #1a1816;">
            Important:
          </strong>
          This verification code is valid for 10 minutes. If you did not request a password reset, please ignore this email.
        </p>
      </div>

      <!-- Closing -->
      <p style="
        margin: 0 0 22px;
        font-size: 13px;
        line-height: 1.6;
        color: #6b6865;
      ">
        If you have questions, please contact your school administrator.
      </p>

      <!-- Footer Divider -->
      <hr style="
        border: 0;
        border-top: 1px solid #e5e3e1;
        margin: 24px 0 18px 0;
      " />

      <!-- Footer Text inside content container -->
      <div style="text-align: center;">
        <p style="
          margin: 0;
          color: #9a9794;
          font-size: 12px;
          line-height: 1.6;
        ">
          This is an automated email from the SalinTinig Educational Portal.
        </p>

        <p style="
          margin: 4px 0 0;
          color: #9a9794;
          font-size: 12px;
        ">
          Please do not reply to this email.
        </p>
      </div>

    </div>

  </div>

  <!-- Anti-Gmail Trimming Hidden Unique Token -->
  <div style="display: none !important; visibility: hidden; opacity: 0; color: #f7f7f6; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; overflow: hidden;">
    [Ref: ${uniqueToken}]
  </div>

</div>
  `;
}

/**
 * Send welcome email with temporary password
 */
async function sendWelcomeEmailWithTempPassword({ toEmail, fullName, role = 'User', tempPassword }) {
  if (!toEmail) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_') || apiKey === 're_your_resend_api_key_here') {
    console.log(`ℹ️ Resend API Key not configured. Skipping welcome email to ${toEmail}.`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const html = renderWelcomeEmailHtml({ fullName, role, toEmail, tempPassword });

    await resend.emails.send({
      from: 'SalinTinig <onboarding@resend.dev>',
      to: [toEmail],
      subject: `Welcome to SalinTinig — Your Account Credentials`,
      html,
    });

    console.log(`✅ Welcome email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Failed to send welcome email to ${toEmail}:`, err.message);
    return false;
  }
}

/**
 * Send new teacher account request email to school admin
 */
async function sendTeacherAccountRequestEmail({ adminEmail, computedFullName, cleanTeacherNo, cleanSex, cleanEmail, cleanSchoolId }) {
  if (!adminEmail) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_') || apiKey === 're_your_resend_api_key_here') {
    console.log(`ℹ️ Resend API Key not configured. Skipping teacher request email to ${adminEmail}.`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const html = renderTeacherAccountRequestEmailHtml({
      computedFullName,
      cleanTeacherNo,
      cleanSex,
      cleanEmail,
      cleanSchoolId,
    });

    await resend.emails.send({
      from: 'SalinTinig <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `New Teacher Activation Request from ${computedFullName}`,
      html,
    });

    console.log(`✅ Teacher account request email sent to admin (${adminEmail})`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Failed to send teacher request email to ${adminEmail}:`, err.message);
    return false;
  }
}

/**
 * Send password reset verification code email
 */
async function sendPasswordResetEmail({ toEmail, fullName, resetCode }) {
  if (!toEmail) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith('re_') || apiKey === 're_your_resend_api_key_here') {
    console.log(`ℹ️ Resend API Key not configured. Skipping reset email to ${toEmail}.`);
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const html = renderPasswordResetEmailHtml({ fullName, toEmail, resetCode });

    await resend.emails.send({
      from: 'SalinTinig <onboarding@resend.dev>',
      to: [toEmail],
      subject: `${resetCode} is your SalinTinig Password Reset Code`,
      html,
    });

    console.log(`✅ Password reset email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Failed to send password reset email to ${toEmail}:`, err.message);
    return false;
  }
}

module.exports = {
  renderWelcomeEmailHtml,
  renderTeacherAccountRequestEmailHtml,
  renderPasswordResetEmailHtml,
  sendWelcomeEmailWithTempPassword,
  sendTeacherAccountRequestEmail,
  sendPasswordResetEmail,
};
