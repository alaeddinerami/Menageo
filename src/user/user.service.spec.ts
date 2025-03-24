import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/roles.enum';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;

  const mockUserData = {
    _id: '12345',
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2a$10$hashedpassword',
    location: 'New York',
    phone: '1234567890',
    image: 'uploads/event-images/test.jpg',
    roles: [Role.cleaner],
  };

  const mockUser: any = {
    ...mockUserData,
    save: jest.fn().mockReturnThis(),
  };

  const mockUserModel = jest.fn().mockImplementation((props: any) => {
    const instance = Object.assign({}, mockUser, props);
    instance.save = jest.fn().mockResolvedValue(instance);
    return instance;
  }) as any;
  mockUserModel.findOne = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockUserModel.find = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockUserModel.findById = jest.fn().mockReturnValue({ exec: jest.fn() });
  mockUserModel.findByIdAndUpdate = jest
    .fn()
    .mockReturnValue({ exec: jest.fn() });
  mockUserModel.findByIdAndDelete = jest
    .fn()
    .mockReturnValue({ exec: jest.fn() });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'New York',
        phone: '1234567890',
      };
      const image = { filename: 'test.jpg' } as Express.Multer.File;

      jest.spyOn(bcrypt, 'hash');
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('$2a$10$hashedpassword' as never);
      mockUserModel.findOne().exec.mockResolvedValue(null);

      const result = await service.create(createUserDto, image);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserModel).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2a$10$hashedpassword',
        location: 'New York',
        phone: '1234567890',
        image: 'uploads/event-images/test.jpg',
        roles: [Role.cleaner],
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        location: 'New York',
        phone: '1234567890',
      };
      mockUserModel.findOne().exec.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto, undefined)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users with cleaner role', async () => {
      mockUserModel.find().exec.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(mockUserModel.find).toHaveBeenCalledWith({
        roles: { $in: ['cleaner'] },
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      mockUserModel.findById().exec.mockResolvedValue(mockUser);

      const result = await service.findOne('12345');

      expect(mockUserModel.findById).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user not found', async () => {
      mockUserModel.findById().exec.mockResolvedValue(null);

      await expect(service.findOne('12345')).rejects.toThrow(
        'User with ID 12345 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      const image = { filename: 'new-test.jpg' } as Express.Multer.File;

      mockUserModel.findById().exec.mockResolvedValue(mockUser);
      mockUserModel.findOne().exec.mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate().exec.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
        image: 'uploads/event-images/new-test.jpg',
      });

      const result = await service.update('12345', updateUserDto, image);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '12345',
        expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane@example.com',
          image: 'uploads/event-images/new-test.jpg',
        }),
        { new: true },
      );
      expect(result).toMatchObject({
        ...mockUser,
        ...updateUserDto,
        image: 'uploads/event-images/new-test.jpg',
      });
    });

    it('should throw ConflictException if email is already in use', async () => {
      const updateUserDto: UpdateUserDto = { email: 'jane@example.com' };
      mockUserModel.findById().exec.mockResolvedValue(mockUser);
      mockUserModel.findOne().exec.mockResolvedValue({
        _id: 'differentId',
        email: 'jane@example.com',
      });

      await expect(service.update('12345', updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById().exec.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndUpdate().exec.mockResolvedValue(null);

      await expect(
        service.update('12345', { name: 'Jane Doe' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserImage', () => {
    it('should update user image successfully', async () => {
      mockUserModel.findByIdAndUpdate().exec.mockResolvedValue(mockUser);

      const result = await service.updateUserImage(
        '12345',
        'new/image/path.jpg',
      );

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '12345',
        { image: 'new/image/path.jpg' },
        { new: true },
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      mockUserModel.findByIdAndDelete().exec.mockResolvedValue(mockUser);

      await service.remove('12345');

      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith('12345');
    });

    it('should throw an error if user not found', async () => {
      mockUserModel.findByIdAndDelete().exec.mockResolvedValue(null);

      await expect(service.remove('12345')).rejects.toThrow(
        'User with ID 12345 not found',
      );
    });
  });
});
