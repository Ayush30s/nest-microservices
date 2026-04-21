// apps/realtime-service/src/realtime-service.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { RealtimeServiceService } from './realtime-service.service';
import { MESSAGE_PATTERNS } from 'libs/common/contants/event';

@Controller()
export class RealtimeServiceController {
  constructor(private readonly realtimeService: RealtimeServiceService) {}

  // gateway uses .send(pattern, data) — expects response → @MessagePattern
  @MessagePattern(MESSAGE_PATTERNS.PROCESS_MESSAGE)
  async processMessage(@Payload() data: any) {
    return this.realtimeService.processMessage(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.PROCESS_JOIN_ROOM)
  async processJoinRoom(@Payload() data: any) {
    return this.realtimeService.processJoinRoom(data);
  }

  // disconnect uses .emit() — fire and forget → @EventPattern
  @EventPattern(MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM)
  async processLeaveRoom(@Payload() data: any) {
    return this.realtimeService.processLeaveRoom(data);
  }

  @EventPattern(MESSAGE_PATTERNS.PROCESS_TYPING)
  async processTyping(@Payload() data: any) {
    return this.realtimeService.processTyping(data);
  }
}
