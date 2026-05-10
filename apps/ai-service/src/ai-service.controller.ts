import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FitnessRagService } from './ai-fitness-rag.service';

@Controller()
export class AiServiceController {
  private readonly logger = new Logger(AiServiceController.name);

  constructor(private readonly fitnessRagService: FitnessRagService) {}

  @MessagePattern({ cmd: 'ingest' })
  async ingest(@Payload() payload: any) {
    this.logger.debug('This is ingest ai-service controller');
    return this.fitnessRagService.saveFitnessDocumentsToVectorDb(payload);
  }

  @MessagePattern({ cmd: 'search' })
  async search(@Payload() data: { q: string; k: number }) {
    return this.fitnessRagService.searchFitnessKnowledge(data.q, data.k);
  }
}
