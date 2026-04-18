import { Controller, Get } from '@nestjs/common';
import { RealtimeServiceService } from './realtime-service.service';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from 'libs/common/contants/event';

@Controller()
export class RealtimeServiceController {
  constructor(private readonly realtimeService: RealtimeServiceService) {}

  @MessagePattern({ cmd: MESSAGE_PATTERNS.PROCESS_MESSAGE })
  async processMessage(data: any) {
    return this.realtimeService.processMessage(data);
  }

  @MessagePattern({ cmd: MESSAGE_PATTERNS.PROCESS_JOIN_ROOM })
  async processJoinRoom(data: any) {
    return this.realtimeService.processJoinRoom(data);
  }

  @MessagePattern({ cmd: MESSAGE_PATTERNS.PROCESS_LEAVE_ROOM })
  async processLeaveRoom(data: any) {
    return this.realtimeService.processLeaveRoom(data);
  }

  @EventPattern({ cmd: MESSAGE_PATTERNS.PROCESS_TYPING })
  async processTyping(data: any) {
    return this.realtimeService.processTyping(data);
  }
}
