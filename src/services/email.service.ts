export interface SendVerificationEmailDTO {
  toEmail: string;
  otp: string;
  recipientName?: string;
}

export interface TransactionalEmailDTO {
  toEmail: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  recipientName?: string;
}

export class EmailService {
  /**
   * Core dispatcher helper
   */
  private static async sendGenericEmail(dto: TransactionalEmailDTO): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    isDevFallback?: boolean;
  }> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || 'RideSetu Notifications <no-reply@ridesetu.com>';

    const isSmtpConfigured = Boolean(smtpHost && smtpPort && smtpUser && smtpPass);

    if (!isSmtpConfigured) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n======================================================================`);
        console.log(`  [DEV EMAIL NOTIFICATION] To: ${dto.toEmail}`);
        console.log(`  [DEV EMAIL NOTIFICATION] Subject: ${dto.subject}`);
        console.log(`  [DEV EMAIL NOTIFICATION] Title: ${dto.title}`);
        console.log(`  [DEV EMAIL NOTIFICATION] Message: ${dto.message}`);
        console.log(`======================================================================\n`);
        return { success: true, messageId: `dev_trans_${Date.now()}`, isDevFallback: true };
      }
      return { success: false, error: 'SMTP unconfigured' };
    }

    try {
      let nodemailer: any;
      try {
        const req = eval('require');
        nodemailer = req('nodemailer');
      } catch {
        nodemailer = null;
      }

      if (!nodemailer) {
        return { success: true, messageId: `dev_fallback_${Date.now()}`, isDevFallback: true };
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0; font-family: sans-serif;">
              Ride<span style="color: #ff6b00;">Setu</span>
            </h2>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Uttarakhand's Premier Vehicle Rental Network</p>
          </div>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #0f172a; font-size: 16px; font-weight: 800; margin-top: 0;">${dto.title}</h3>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">${dto.message}</p>
            ${
              dto.actionUrl
                ? `<div style="margin-top: 20px; text-align: center;">
                    <a href="${dto.actionUrl}" style="background-color: #ff6b00; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block;">
                      ${dto.actionText || 'View Details'}
                    </a>
                   </div>`
                : ''
            }
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            RideSetu Mobility Operations • Dehradun & Rishikesh, Uttarakhand
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: smtpFrom,
        to: dto.toEmail,
        subject: dto.subject,
        html: htmlContent,
      });

      return { success: true, messageId: `msg_${Date.now()}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends a professional RideSetu email verification OTP
   */
  public static async sendVerificationEmail(dto: SendVerificationEmailDTO): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    isDevFallback?: boolean;
  }> {
    return this.sendGenericEmail({
      toEmail: dto.toEmail,
      subject: 'RideSetu Account Verification Code',
      title: 'Verify Your Email Address',
      message: `Your account verification code is: <strong style="color:#ff6b00; font-size:20px;">${dto.otp}</strong>. Valid for 5 minutes.`,
      recipientName: dto.recipientName,
    });
  }

  /**
   * Booking Notification Emails
   */
  public static async sendBookingNotificationEmail(dto: TransactionalEmailDTO) {
    return this.sendGenericEmail(dto);
  }

  /**
   * Vendor Application Status Emails
   */
  public static async sendVendorStatusEmail(dto: TransactionalEmailDTO) {
    return this.sendGenericEmail(dto);
  }

  /**
   * Admin Operations Alert Emails
   */
  public static async sendAdminAlertEmail(dto: TransactionalEmailDTO) {
    return this.sendGenericEmail(dto);
  }
}
