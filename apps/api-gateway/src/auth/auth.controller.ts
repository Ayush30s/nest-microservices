import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import { CircuitBreakerService } from '../common/circuitBreaker';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from 'libs/common/aws/aws.service';
import { JwtAuthGuard } from 'libs/common/auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

@Controller('auth')
export class AuthController {
  private readonly key = 'auth-service';
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly aws: AwsService,
    private readonly authService: AuthService,
    private readonly cbBreaker: CircuitBreakerService,
    private readonly configService: ConfigService,
  ) {}

  private getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
  }

  private getPlatform(userAgent?: string | string[]): string {
    const ua = Array.isArray(userAgent)
      ? userAgent[0]?.toLowerCase()
      : userAgent?.toLowerCase();

    if (!ua) return 'unknown';

    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    if (ua.includes('linux')) return 'Linux';

    if (ua.includes('postmanruntime')) return 'Postman';

    return 'unknown';
  }

  @Post('create-role')
  @UseGuards(JwtAuthGuard)
  async createRole(@Body() roleDto: RoleDto) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'create-role',
      async () => this.authService.createRole(roleDto),
    );

    return breaker.fire();
  }

  @Post('signin')
  async signUser(
    @Body() signInDto: SigninDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];

    const device =
      typeof userAgent === 'string' && userAgent.trim()
        ? userAgent
        : 'Unknown Device';

    const payload = {
      ...signInDto,
      ipAddress: this.getClientIp(req),
      device,
      platform: this.getPlatform(userAgent),
    };

    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'signin',
      async (dto: typeof payload) => this.authService.signUser(dto),
    );

    const result = await breaker.fire(payload);

    const isSecure =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return result;
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('profileImageUrl'))
  async registerUser(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDto: RegisterDTO,
  ) {
    const awsS3res = file ? await this.aws.uploadFile(file) : null;
    const profileImageUrl = awsS3res?.url;
    const breaker = this.cbBreaker.getBreaker(this.key, 'register', async () =>
      this.authService.registerUser({
        ...registerDto,
        profileImageUrl,
      }),
    );

    this.logger.debug(`singin controller in api gateway ${registerDto}`);
    return breaker.fire();
  }

  @Post('refresh-token')
  async refreshToken(@Body() token: string) {
    const breaker = this.cbBreaker.getBreaker(
      this.key,
      'refresh-token',
      async () => {
        this.authService.refreshToken(token);
      },
    );

    return breaker.fire();
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
