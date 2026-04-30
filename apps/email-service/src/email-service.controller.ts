import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email-service.service';

export type UserRegisteredEvent = {
  userId: number;
  email: string;
  name?: string;
  verificationToken?: string;
};

@Controller()
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {
    this.logger.log('Emial service initialized');
  }

  @EventPattern({ cmd: 'user-registered' })
  async handleUserRegistered(@Payload() data: UserRegisteredEvent) {
    this.logger.log(`Sending registration email to ${data.email}`);

    await this.emailService.sendWelcomeEmail(data);
  }
}
