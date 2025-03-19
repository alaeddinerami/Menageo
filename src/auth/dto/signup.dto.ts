import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'password must be 6 character' })
  password: string;

  @IsString()
  location: string;
  @IsString()
  @MinLength(10, { message: 'phone must be 10 character' })
  phone: string;
}
