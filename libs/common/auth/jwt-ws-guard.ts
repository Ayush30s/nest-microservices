// guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    try {
      // Extract token from handshake auth or headers
      const token = this.extractToken(client);
      
      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // Attach user data to socket for later use
      client.data.user = payload;
      
      return true;
    } catch (error: any) {
      this.logger.error(`Authentication failed: ${error.message}`);
      client.emit('error', { 
        message: 'Authentication failed', 
        code: 'UNAUTHORIZED' 
      });
      client.disconnect();
      return false;
    }
  }

  private extractToken(client: Socket): string | undefined {
    // Check multiple possible token locations
    return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.split(' ')[1] ||
      client.handshake.query?.token as string
    );
  }
}