import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — notification emails will be skipped');
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'Koru HRM <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${to}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}