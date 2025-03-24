import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from 'src/common/enums/roles.enum';
import * as bcrypt from 'bcryptjs';
import { log } from 'console';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(
    createUserDto: CreateUserDto,
    image: Express.Multer.File,
  ): Promise<User> {
    const { email, password, name, location, phone } = createUserDto;

    console.log('data', createUserDto);
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const imagePath = image ? `uploads/event-images/${image.filename}` : null;
    const cleaner = new this.userModel({
      name,
      email,
      password: hashedPassword,
      location,
      phone,
      image: imagePath,
      roles: [Role.cleaner],
    });

    return cleaner.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find({ roles: { $in: ['cleaner'] } }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    image?: Express.Multer.File
  ): Promise<User> {
    const updateFields: any = {};

    const currentUser = await this.findOne(id);

    if (updateUserDto.name) updateFields.name = updateUserDto.name;
    if (updateUserDto.location) updateFields.location = updateUserDto.location;
    if (updateUserDto.phone) updateFields.phone = updateUserDto.phone;
    if (updateUserDto?.email && updateUserDto.email !== currentUser.email) {
      const emailExists = await this.userModel.findOne({ email: updateUserDto.email }).exec();
      if (emailExists && emailExists._id.toString() !== id) {
        throw new ConflictException(`Email ${updateUserDto.email} is already in use by another user`);
      }
      updateFields.email = updateUserDto.email;
    }
    if (image) {
      updateFields.image = `uploads/event-images/${image.filename}`;
    }

    if (Object.keys(updateFields).length === 0) {
      console.log('No fields to update, returning current user');
      return this.findOne(id);
    }


    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateFields, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updateUserImage(id: string, imagePath: string): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { image: imagePath }, { new: true })
      .exec();
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new Error(`User with ID ${id} not found`);
    }
  }
}
