import { ConflictException, Injectable, Logger } from '@nestjs/common';
import {
  ProfileDto,
  RegisterDTO,
  RoleDto,
  SigninDto,
} from 'libs/common/DTO/auth.dto';
import { PrismaService } from 'libs/common/prismaConfig/prisma.service';
import * as bcrypt from 'bcrypt';
import { AwsService } from 'libs/common/aws/aws.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { profile } from 'console';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly aws: AwsService,
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
      role: user.roleId,
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
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const role = await tx.role.findUnique({
        where: { name: registerDto.role },
      });

      if (!role) {
        throw new Error('Invalid Role');
      }

      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          name: registerDto.name,
          passwordHash: hashedPassword,

          role: {
            connect: { name: registerDto.role ?? 'USER' },
          },

          isActive: true,
          isEmailVerified: false,

          profileImageUrl: registerDto.profileImageUrl ?? null,
          address: registerDto.address
            ? {
                create: {
                  state: registerDto.address.state,
                  city: registerDto.address.city,
                  pincode: registerDto.address.pincode,
                },
              }
            : undefined,

          profile: registerDto.profile
            ? {
                create: {
                  gender: registerDto.profile.gender,
                  dob: new Date(registerDto.profile.dob),
                  heightCm: registerDto.profile.heightCm,
                  weightKg: registerDto.profile.weightKg,
                  profileImageUrl: registerDto.profile.profileImageUrl,
                  address: registerDto.profile.address,
                  bio: registerDto.profile.bio,
                  contact_no: registerDto.profile.contact_no,
                },
              }
            : undefined,
        },
        include: {
          role: true,
          address: true,
          profile: true,
        },
      });

      this.logger.log('REGISTER OUTPUT:', registerDto);

      return user;
    });
  }
}
