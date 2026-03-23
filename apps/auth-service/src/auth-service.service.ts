import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'libs/common/prismaService/prisma.service';
import { AwsService } from 'libs/common/aws/aws.service';
import { SigninDto, RegisterDTO } from 'libs/common/DTO/auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly awsService: AwsService,
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // ================== LOGIN ==================
  async signin(signinDTO: SigninDto, res: any) {
    const { email, password } = signinDTO;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
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
      email: user.email,
      role: user.role?.name,
    };

    // 🔑 Access Token
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });

    // 🔄 Refresh Token
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    // 💾 Store refresh token in DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 🍪 Cookie set
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60,
    });

    return {
      accessToken,
      refreshToken,
      user: payload,
    };
  }

  // ================== REGISTER ==================
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
            roleId: 1, // default role
            location: {
              connect: {
                id: locationCreated.id,
              },
            },
          },
        });
      });

      return { msg: `User ${userCreated.id} Created Successfully` };
    } catch (error) {
      // ❌ Cleanup uploaded image
      if (imageUploaded?.key) {
        try {
          await this.awsService.deleteFile(imageUploaded.key);
        } catch (cleanupErr) {
          this.logger.error('Failed to remove file', cleanupErr);
        }
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('User already exists');
        }
      }

      throw error;
    }
  }

  // ================== REFRESH TOKEN ==================
  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: any = this.jwtService.verify(token, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    const newAccessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    return { accessToken: newAccessToken };
  }

  // ================== LOGOUT ==================
  async logout(token: string) {
    await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }
}
