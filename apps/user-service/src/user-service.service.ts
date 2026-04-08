import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AwsService } from 'libs/common/aws/aws.service';
import { ProfileDto } from 'libs/common/DTO/auth.dto';
import { UserPrismaService } from './user-prisma.service';

@Injectable()
export class UserServiceService {
  private readonly logger = new Logger(UserServiceService.name);

  constructor(
    private readonly prisma: UserPrismaService,
    private readonly aws: AwsService,
  ) {}

  async upsertProfile(profileDto: ProfileDto) {
    return await this.prisma.$transaction(async (tx) => {
      const userId = profileDto.id;

      const user = await tx.user.findUnique({
        where: { id: Number(userId) },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      this.logger.debug(profileDto);

      const profile = await tx.profile.upsert({
        where: {
          userId: Number(userId),
        },
        update: {
          gender: profileDto.gender,
          dob: new Date(profileDto.dob),
          heightCm: Number(profileDto.heightCm),
          weightKg: Number(profileDto.weightKg),
          profileImageUrl: profileDto.profileImageUrl,
          address: profileDto.address,
          bio: profileDto.bio,
          contact_no: profileDto.contact_no,
        },
        create: {
          userId: Number(userId),
          gender: profileDto.gender,
          dob: new Date(profileDto.dob),
          heightCm: Number(profileDto.heightCm),
          weightKg: Number(profileDto.weightKg),
          profileImageUrl: profileDto.profileImageUrl || '',
          address: profileDto.address,
          bio: profileDto.bio,
          contact_no: profileDto.contact_no,
        },
      });

      this.logger.debug(profile);

      return profile;
    });
  }

  async getProfile(userId: Number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: Number(userId) },
      include: {
        profile: true,
        address: true,
      },
    });

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}
