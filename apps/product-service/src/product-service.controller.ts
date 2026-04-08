import { Controller, Get } from '@nestjs/common';
import { GymServiceService } from './product-service.service';

@Controller()
export class GymServiceController {
  constructor(private readonly GymServiceService: GymServiceService) {}

  @Get()
  getHello(): string {
    return this.GymServiceService.getHello();
  }
}
