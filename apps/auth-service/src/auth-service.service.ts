import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { AuthPrismaService } from './auth-prisma.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: AuthPrismaService,
    @Inject('USER_SERVICE') private clientProxy: ClientProxy,
  ) {}

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

  async signIn(signinDTO: SigninDto) {
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

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, payload };
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

      this.clientProxy.emit('user-registered', {
        authId: user.id,
        email: user.email,
        name: registerDto.name,
        profileImageUrl: registerDto.profileImageUrl,
        address: registerDto.address,
        profile: registerDto.profile,
      });

      this.logger.log(
        `REGISTER OUTPUT: Emitted user.registered for ${user.email}`,
      );

      const { passwordHash, ...safeUser } = user;

      return safeUser;
    });
  }
}
