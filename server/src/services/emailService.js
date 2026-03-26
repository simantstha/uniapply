import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordReset({ to, name, resetUrl }) {
  const subject = 'Reset your UniApply password';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FDF8F5;">
      <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid rgba(196,98,45,0.12);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #C4622D; border-radius: 12px; margin-bottom: 12px;">
            <span style="color: #fff; font-size: 20px; font-weight: 700;">U</span>
          </div>
          <h2 style="color: #1E2D40; margin: 0; font-size: 20px; font-weight: 600;">Reset your password</h2>
        </div>
        <p style="color: #4A5568; margin: 0 0 12px;">Hi ${name},</p>
        <p style="color: #4A5568; margin: 0 0 24px;">We received a request to reset your UniApply password. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#C4622D;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
            Reset Password
          </a>
        </div>
        <p style="color: #4A5568; margin: 0 0 8px; font-size: 13px;">Or copy and paste this link into your browser:</p>
        <p style="color: #C4622D; font-size: 12px; word-break: break-all; margin: 0 0 24px;">${resetUrl}</p>
        <p style="color: #888; font-size: 12px; margin: 0; border-top: 1px solid rgba(196,98,45,0.1); padding-top: 16px;">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"UniApply" <noreply@uniapply.com>',
    to,
    subject,
    html,
  });
}

export async function sendEmailVerification({ to, name, verifyUrl }) {
  const subject = 'Verify your UniApply email';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FDF8F5;">
      <div style="background: #fff; border-radius: 16px; padding: 32px; border: 1px solid rgba(196,98,45,0.12);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #C4622D; border-radius: 12px; margin-bottom: 12px;">
            <span style="color: #fff; font-size: 20px; font-weight: 700;">U</span>
          </div>
          <h2 style="color: #1E2D40; margin: 0; font-size: 20px; font-weight: 600;">Verify your email address</h2>
        </div>
        <p style="color: #4A5568; margin: 0 0 12px;">Hi ${name},</p>
        <p style="color: #4A5568; margin: 0 0 24px;">Welcome to UniApply! Please verify your email address to unlock all features of your account.</p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${verifyUrl}"
             style="display:inline-block;background:#C4622D;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
            Verify Email
          </a>
        </div>
        <p style="color: #4A5568; margin: 0 0 8px; font-size: 13px;">Or copy and paste this link into your browser:</p>
        <p style="color: #C4622D; font-size: 12px; word-break: break-all; margin: 0 0 24px;">${verifyUrl}</p>
        <p style="color: #888; font-size: 12px; margin: 0; border-top: 1px solid rgba(196,98,45,0.1); padding-top: 16px;">If you didn't create a UniApply account, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"UniApply" <noreply@uniapply.com>',
    to,
    subject,
    html,
  });
}

export async function sendDeadlineReminder({ to, name, universityName, program, daysLeft, deadline }) {
  const deadlineStr = new Date(deadline).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const subject = `⏰ ${daysLeft} days left: ${universityName} application deadline`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #C4622D;">Application Deadline Reminder</h2>
      <p>Hi ${name},</p>
      <p>Your application to <strong>${universityName}</strong> (${program}) is due in <strong>${daysLeft} days</strong> — <strong>${deadlineStr}</strong>.</p>
      <p>Log in to UniApply to check what's still missing and finish your Statement of Purpose.</p>
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/universities"
         style="display:inline-block;background:#C4622D;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">
        Open UniApply
      </a>
      <p style="color:#888;font-size:12px;margin-top:32px;">You're receiving this because you added ${universityName} to your UniApply list.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"UniApply" <noreply@uniapply.com>',
    to,
    subject,
    html,
  });
}
