import { Inject, Injectable } from '@nestjs/common';
import {
  CreateGymDto,
  CreateShiftDto,
  CreateTrainerDto,
} from 'libs/common/DTO/gym.dto';
import { GymPrismaService } from './gym-prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';

@Injectable()
export class GymServiceService {
  constructor(
    private readonly prisma: GymPrismaService,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) {}

  async createGym(createGymDto: CreateGymDto) {
    return this.prisma.$transaction(async (tx) => {
      const baseSlug = createGymDto.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');

      let slug = baseSlug;
      let count = 1;

      while (await tx.gym.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${count++}`;
      }

      try {
        const createdGym = await tx.gym.create({
          data: {
            name: createGymDto.name,
            description: createGymDto.description,
            image: createGymDto.image,
            coverImage: createGymDto.coverImage,
            ownerId: createGymDto.ownerId,
            maxMembers: createGymDto.maxMembers,
            isPrivate: createGymDto.isPrivate ?? false,
            slug,
          },
        });

        return {
          statusCode: 201,
          type: 'success',
          message: 'Gym created successfully',
          data: createdGym,
        };
      } catch (error: any) {
        if (error.code === 'P2002') {
          throw new RpcException({
            statusCode: 409,
            type: 'error',
            message: 'Gym name already taken',
          });
        }

        throw new RpcException({
          statusCode: 500,
          type: 'error',
          message: 'Failed to create gym',
        });
      }
    });
  }

  async createShift(dto: CreateShiftDto) {
    try {
      const gym = await this.prisma.gym.findUnique({
        where: { id: dto.gymId },
      });

      if (!gym) {
        throw new RpcException('Gym not found');
      }

      if (dto.trainerId) {
        const trainer = await this.prisma.trainer.findUnique({
          where: { id: dto.trainerId },
        });

        if (!trainer) {
          throw new RpcException('Trainer not found');
        }
      }

      if (new Date(dto.startTime) >= new Date(dto.endTime)) {
        throw new RpcException('Start time must be before end time');
      }

      const shift = await this.prisma.shift.create({
        data: {
          name: dto.name,
          description: dto.description,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          maxMembers: dto.maxMembers,
          gymId: dto.gymId,
          trainerId: dto.trainerId,
          dayOfWeek: dto.dayOfWeek,
          isRecurring: dto.isRecurring ?? false,
          price: dto.price,
          isPremium: dto.isPremium ?? false,
          bookingRequired: dto.bookingRequired ?? true,
        },
      });

      return shift;
    } catch (error: any) {
      throw new RpcException(error.message || 'Failed to create shift');
    }
  }

  async createTrainer(dto: CreateTrainerDto) {
    try {
      const existing = await this.prisma.trainer.findUnique({
        where: { trainerId: dto.trainerId },
      });

      if (existing) {
        throw new RpcException('Trainer already exists');
      }

      const user = this.userClient.send({ cmd: 'get-user' }, dto.trainerId);
      if (!user) throw new RpcException('User not found');

      const trainer = await this.prisma.trainer.create({
        data: {
          trainerId: dto.trainerId,
          specialization: dto.specialization,
          bio: dto.bio,
          hourlyRate: dto.hourlyRate,
        },
      });

      return trainer;
    } catch (error: any) {
      throw new RpcException(error.message || 'Failed to create trainer');
    }
  }
}
