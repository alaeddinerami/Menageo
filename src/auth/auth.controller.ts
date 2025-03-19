import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { single } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { ImageUploadInterceptor } from 'src/common/middleware/multer.middleware';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  @UseInterceptors(ImageUploadInterceptor())
  SugnUp(
    @Body() SignupDto: SignupDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    console.log(SignupDto);
    return this.authService.signUp(SignupDto, image);
  }
  @Post('login')
  login(@Body() LoginDto: LoginDto) {
    return this.authService.login(LoginDto);
  }
}
