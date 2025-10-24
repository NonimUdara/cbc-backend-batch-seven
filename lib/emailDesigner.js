export default function getDesignedEmail({
  otp,
  companyName = "Your Company",
  supportEmail = "support@yourcompany.com",
  validityMinutes = 10,
}) {
  const year = new Date().getFullYear();

  return `
  <div style="background-color:#FEF3E2; padding:40px; font-family:'Segoe UI', Roboto, Arial, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 8px rgba(0,0,0,0.08); overflow:hidden;">
      
      <div style="background-color:#FA812F; padding:20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:24px;">Secure Password Reset</h1>
      </div>

      <div style="padding:30px; text-align:center; color:#393e46;">
        <p style="font-size:16px; margin-bottom:20px;">
          Hello 👋,<br>
          You’ve requested to reset your password. Please use the following one-time password (OTP) to complete the process:
        </p>

        <div style="margin:20px auto; background-color:#FA812F; color:#ffffff; display:inline-block; padding:12px 24px; border-radius:8px; font-size:22px; letter-spacing:2px; font-weight:bold;">
          ${otp}
        </div>

        <p style="font-size:14px; margin-top:25px; color:#555;">
          ⚠️ This OTP is valid for <strong>${validityMinutes} minutes</strong>. Do not share it with anyone for your security.
        </p>

        <p style="margin-top:30px; font-size:14px; color:#777;">
          If you didn’t request this, you can safely ignore this email.
        </p>
      </div>

      <div style="background-color:#393e46; color:#ffffff; text-align:center; padding:15px; font-size:13px;">
        &copy; ${year} ${companyName}. All rights reserved.<br>
        Need help? <a href="mailto:${supportEmail}" style="color:#FA812F; text-decoration:none;">Contact Support</a>
      </div>
    </div>
  </div>
  `;
}
