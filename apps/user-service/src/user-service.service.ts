import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AwsService } from 'libs/common/aws/aws.service';
import { UserPrismaService } from './user-prisma.service';
import { ProfileDto } from 'libs/common/DTO/user.dto';

@Injectable()
export class UserServiceService {
  private readonly logger = new Logger(UserServiceService.name);

  constructor(
    private readonly prisma: UserPrismaService,
    private readonly aws: AwsService,
  ) {}

  async upsertProfile(profileDto: ProfileDto) {
    return await this.prisma.$transaction(async (tx) => {
      const authId = Number(profileDto.id);

      const user = await tx.user.upsert({
        where: { authId: authId },
        update: {
          ...(profileDto.name && { name: profileDto.name }),
          ...(profileDto.email && { email: profileDto.email }),
        },
        create: {
          authId: authId,
          email: profileDto.email ?? `placeholder-${authId}@temp.com`,
          name: profileDto.name,
        },
      });

      this.logger.debug(`User synced in User DB with internal ID: ${user.id}`);

      const profile = await tx.profile.upsert({
        where: {
          userId: user.id,
        },
        update: {
          gender: profileDto.gender,
          dob: profileDto.dob ? new Date(profileDto.dob) : undefined,
          heightCm: profileDto.heightCm
            ? Number(profileDto.heightCm)
            : undefined,
          weightKg: profileDto.weightKg
            ? Number(profileDto.weightKg)
            : undefined,
          profileImageUrl: profileDto.profileImageUrl,
          address: profileDto.address,
          bio: profileDto.bio,
          contact_no: profileDto.contact_no,
        },
        create: {
          userId: user.id,
          gender: profileDto.gender ?? 'UNSPECIFIED',
          dob: profileDto.dob ? new Date(profileDto.dob) : new Date(),
          heightCm: Number(profileDto.heightCm ?? 0),
          weightKg: Number(profileDto.weightKg ?? 0),
          profileImageUrl: profileDto.profileImageUrl ?? '',
          address: profileDto.address ?? '',
          bio: profileDto.bio ?? '',
          contact_no: profileDto.contact_no ?? '',
        },
      });

      this.logger.debug('Profile Upserted successfully');

      return profile;
    });
  }

  async getProfile(authId: number) {
    const user = await this.prisma.user.findUnique({
      where: { authId: authId },
      include: {
        profile: true,
        address: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with auth ID ${authId} not found in User Service`,
      );
    }

    return user;
  }
}
