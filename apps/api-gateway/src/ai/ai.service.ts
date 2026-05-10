import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(@Inject('AI_SERVICE') private client: ClientProxy) {}

  ingest(payload: any) {
    this.logger.verbose('Ai service api-gateway hit');
    return this.client.send({ cmd: 'ingest' }, payload);
  }

  search(query: string) {
    return this.client.send({ cmd: 'search' }, { q: query, k: 5 });
  }
}
