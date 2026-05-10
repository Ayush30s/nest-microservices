import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AiService } from './ai.service';

@Controller('agent')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ingest')
  async ingest(@Body('payload') payload: any) {
    this.logger.verbose('Ai controller api-gateway hit');
    return lastValueFrom(this.aiService.ingest(payload));
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return lastValueFrom(this.aiService.search(query));
  }
}
