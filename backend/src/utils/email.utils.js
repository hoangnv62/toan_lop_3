import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP_USER/SMTP_PASS chưa cấu hình — bỏ qua gửi email');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendAnnouncementEmail(to, relativeName, studentName, className, teacherName, title, content) {
  const transport = getTransporter();
  if (!transport) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `[Thông báo lớp ${className}] ${title}`;
  const html = buildEmailHtml(relativeName, studentName, className, teacherName, title, content);

  try {
    await transport.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error(`[Email] Gửi thất bại tới ${to}:`, err.message);
  }
}

function buildEmailHtml(relativeName, studentName, className, teacherName, title, content) {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const contentHtml = content.replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:#4F46E5;padding:28px 32px">
            <p style="margin:0;color:#c7d2fe;font-size:13px">Hệ thống E-Learning Toán lớp 3</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px">Thông báo từ lớp học</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px">
            <p style="margin:0 0 16px;color:#374151">Kính gửi <strong>${relativeName}</strong>,</p>
            <p style="margin:0 0 20px;color:#374151">
              Giáo viên <strong>${teacherName}</strong> vừa gửi thông báo tới lớp <strong>${className}</strong>
              liên quan đến học sinh <strong>${studentName}</strong>:
            </p>
            <!-- Announcement box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border-left:4px solid #4F46E5;border-radius:4px;margin-bottom:20px">
              <tr>
                <td style="padding:16px 20px">
                  <p style="margin:0 0 8px;color:#1e1b4b;font-size:16px;font-weight:700">${title}</p>
                  <p style="margin:0;color:#374151;line-height:1.6">${contentHtml}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#9ca3af;font-size:12px">Thời gian: ${now}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
              Email này được gửi tự động từ hệ thống E-Learning Toán lớp 3. Vui lòng không trả lời.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
