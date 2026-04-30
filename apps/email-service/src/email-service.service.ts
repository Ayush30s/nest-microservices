// apps/email-service/src/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UserRegisteredEvent } from './email-service.controller';

@Injectable()
export class EmailService {
  private readonly logger = new Logger();
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(data: UserRegisteredEvent) {
    this.logger.verbose('Sending email ...');

    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Welcome to My App',
      html: `
        <h2>Welcome ${data.name ?? 'User'}!</h2>
        <p>Your account has been created successfully.</p>
      `,
    });

    return {
      message: 'Email sent successfully',
    };
  }
}
