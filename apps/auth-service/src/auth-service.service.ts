import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Res,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'libs/common/prismaService/prisma.service';
import { AwsService } from 'libs/common/aws/aws.service';
import { SigninDto } from 'libs/common/DTO/user.dto';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly awsService: AwsService,
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async signin(signinDTO: SigninDto, res: Response) {
    const { email, password } = signinDTO;

    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      userName: user.userName,
      email: email,
    };

    const accessToken = this.jwtService.sign(payload);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    });

    return { accessToken, payload };
  }

  async register(registerDTO: RegisterDTO, profileImage: Express.Multer.File) {
    const { email, password, dob, gender, location, mobile, userName, name } =
      registerDTO;

    const passwordHash = await bcrypt.hash(password, 12);
    const { landmark, street, city, pincode, country, countryCode, state } =
      location;

    const imageUploaded = await this.awsService.uploadFile(profileImage);

    try {
      const userCreated = await this.prisma.$transaction(async (tx) => {
        const locationCreated = await tx.location.create({
          data: {
            landmark,
            street,
            city,
            pincode,
            country,
            countryCode,
            state,
          },
        });

        return await tx.user.create({
          data: {
            email,
            passwordHash,
            userName,
            dob,
            mobile,
            gender,
            name,
            profileImage: imageUploaded.key,
            location: {
              connect: {
                id: locationCreated.id,
              },
            },
          },
        });
      });

      return { msg: `User ${userCreated.id} Id Created SuccessFully` };
    } catch (error) {
      if (imageUploaded?.key) {
        try {
          await this.awsService.deleteFile(imageUploaded.key);
        } catch (cleanupErr) {
          this.logger.error('Failed to remove the file', cleanupErr);
        }
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User Already exists');
        }
      }

      throw error;
    }
  }
}
