import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { RegisterDTO, RoleDto, SigninDto } from 'libs/common/DTO/auth.dto';
import { PrismaService } from 'libs/common/prismaConfig/prisma.service';
import * as bcrypt from 'bcrypt';
import { AwsService } from 'libs/common/aws/aws.service';

@Injectable()
export class AuthServiceService {
  private readonly logger = new Logger(AuthServiceService.name);

  constructor(
    private readonly prism: PrismaService,
    private readonly aws: AwsService,
  ) {}

  async createRole(roleDto: RoleDto) {
    const res = await this.prism.role.upsert({
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

  async signIn(singInDto: SigninDto) {
    const res = await this.prism.user.create({
      data: {
        email: singInDto.email,
        passwordHash: singInDto.password,
      },
    });
  }

  async registerUser(registerDto: RegisterDTO) {
    return await this.prism.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const role = await tx.role.findUnique({
        where: { name: registerDto.role ?? 'USER' },
      });

      if (!role) {
        throw new Error('Invalid Role');
      }

      let imageUrl = '';
      if (registerDto.profileImageUrl) {
        const awsS3Res = await this.aws.uploadFile(registerDto.profileImageUrl);
        imageUrl = awsS3Res.url;
      }

      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          name: registerDto.name,
          passwordHash: hashedPassword,

          role: {
            connect: { id: role.id },
          },

          isActive: registerDto.isActive ?? true,
          isEmailVerified: registerDto.isEmailVerified ?? false,
          profileImageUrl: imageUrl,

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

      return user;
    });
  }
}
