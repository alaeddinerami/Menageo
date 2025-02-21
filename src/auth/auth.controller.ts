import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { single } from 'rxjs';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  SugnUp(@Body() SignupDto: SignupDto){
    return this.authService.signUp(SignupDto)
  }
  @Post('login')
  login(@Body() LoginDto: LoginDto){
    return this.authService.login(LoginDto)
  }

}
