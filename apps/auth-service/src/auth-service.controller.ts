import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth-service.service';
import { RegisterDTO, SigninDto } from 'libs/common/DTO/user.dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ smd: 'signin' })
  handleSignin(
    @Body() signinDTO: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signin(signinDTO, res);
  }

  @MessagePattern({ smd: 'register' })
  @UseInterceptors(FileInterceptor('profileImage'))
  handleRegister(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerDTO: RegisterDTO,
  ) {
    return this.authService.register(registerDTO, file);
  }
}
