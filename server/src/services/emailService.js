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
