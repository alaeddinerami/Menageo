import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { Role } from '../common/enums/roles.enum';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async onApplicationBootstrap() {
    await this.seedAdminUser();
  }

  async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      console.error('Admin email or password not provided in configuration');
      return;
    }

    try {
      const existingAdmin = await this.userModel.findOne({ email: adminEmail }).exec();
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 8);
        const adminUser = await this.userModel.create({
          name: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          roles: [Role.Admin],
          phone: '0631713538',
          location: 'Admin Office',
          image: null,
        });
      } else {
        log('Admin user already exists:', adminEmail);
      }
    } catch (error) {
      console.error('Error seeding admin user:', error.message);
    }
  }
  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid token'); 
    }
    return user;
  }

  async signUp(
    signupDto: SignupDto,
    image: Express.Multer.File,
  ): Promise<{ user: User; token: string }> {
    log(signupDto);
    const { name, email, password, phone, location } = signupDto;

    const userExist = await this.userModel.findOne({ email }).exec();
    if (userExist) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const imagePath = image ? `uploads/event-images/${image.filename}` : null;

    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      roles: [Role.client],
      phone,
      location,
      image: imagePath,
    });

    const payload = {
      id: user._id.toString(),
      name: user.name,
      roles: user.roles,
    };
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

    const payload = {
      id: user._id.toString(),
      name: user.name,
      roles: user.roles,
    };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }
}
