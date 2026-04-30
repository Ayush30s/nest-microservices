import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { StringValue } from 'ms';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { AuthPrismaService } from './auth-prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: AuthPrismaService,
    @Inject('EMAIL_SERVICE')
    private readonly emailClient: ClientProxy,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) {}

  private hashRefreshToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createRole(roleDto: RoleDto) {
    const res = await this.prisma.role.upsert({
      where: {
        name: roleDto.name,
      },
      update: {},
      create: {
        name: roleDto.name,
      },
    });

    return `role created: ${JSON.stringify(res)}`;
  }

  async signIn(signinDTO: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: signinDTO.email },
      include: { role: true },
    });

    if (!user) throw new RpcException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(
      signinDTO.password,
      user.passwordHash,
    );

    if (!isPasswordValid) throw new RpcException('Invalid credentials');

    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      type: 'accessToken',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    const refreshTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      type: 'refreshToken',
    };

    const refershToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '7d',
    });

    const refreshTokenHash = this.hashRefreshToken(refershToken);

    this.logger.warn(signinDTO);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: signinDTO?.ipAddress,
        device: signinDTO?.device,
        revoked: false,
        platform: signinDTO.platform,
      },
    });

    this.logger.warn('session====', session);

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
    };

    return { accessToken, refershToken, userPayload };
  }

  async registerUser(registerDto: RegisterDTO) {
    return await this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new RpcException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const roleName = registerDto.role ?? 'USER';
      const role = await tx.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        throw new RpcException('Invalid Role');
      }

      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          passwordHash: hashedPassword,
          isActive: true,
          isEmailVerified: false,
          role: {
            connect: { name: role.name },
          },
        },
        include: {
          role: true,
        },
      });

      this.userClient.emit(
        { cmd: 'user-registered' },
        {
          authId: user.id,
          email: user.email,
          name: registerDto.name,
          profileImageUrl: registerDto.profileImageUrl,
          address: registerDto.address,
          profile: registerDto.profile,
        },
      );

      this.logger.log(
        `REGISTER OUTPUT: Emitted user.registered for ${user.email}`,
      );

      const { passwordHash, ...safeUser } = user;

      return safeUser;
    });
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

      const accessSecret =
        this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

      const accessExpiresIn =
        this.configService.get<StringValue>('JWT_ACCESS_EXPIRES_IN') ?? '1h';

      const payload = await this.jwtService.verifyAsync<{
        id: string;
        sub: string;
        email: string;
        type: string;
      }>(refreshToken, {
        secret: refreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const newAccessToken = await this.jwtService.signAsync(
        {
          id: payload.id,
          sub: payload.sub,
          email: payload.email,
          type: 'access',
        },
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn,
        },
      );

      return {
        accessToken: newAccessToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(token: string) {
    const tokenHash = this.hashRefreshToken(token);

    const result = await this.prisma.userSession.updateMany({
      where: {
        refreshTokenHash: tokenHash,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    this.logger.log(`logout result====== ${JSON.stringify(result)}`);

    return {
      message: 'Logged out successfully',
      result,
    };
  }
}
