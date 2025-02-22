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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }

  async signUp(signupDto: SignupDto): Promise<{ user: User; token: string }> {
    const { name, email, password } = signupDto;

    const userExist = await this.userModel.findOne({ email }).exec();
    if (userExist) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      roles: [Role.Admin], 
    });

    const payload = { id: user._id.toString(), name: user.name, roles: user.roles };
    const token = this.jwtService.sign(payload); 

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { id: user._id.toString(), name: user.name, roles: user.roles };
    const token = this.jwtService.sign(payload); 

    return { user, token };
  }
}