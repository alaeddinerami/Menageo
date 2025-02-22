import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { Role } from 'src/common/enums/roles.enum';
import { error } from 'console';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signUp(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    const userExist = await this.userModel.findOne({email}).exec()
    if(userExist) throw new ConflictException('user already exist')
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      roles: [Role.client], 
    });

    await user.save();

    const token = await this.jwtService.sign(
      { id: user.id,name: user.name, roles: user.roles },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES'),
      },
    );
    return {user, token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) throw new UnauthorizedException('Invalid email or password');
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid email or password');

    const token = await this.jwtService.sign(
      { id: user.id, name:user.name, roles: user.roles },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
      },
    );
    return { user,token };
  }
}