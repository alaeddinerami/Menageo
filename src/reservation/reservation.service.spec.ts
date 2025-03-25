import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReservationService } from './reservation.service';
import {
  Reservation,
  ReservationDocument,
} from './entities/reservation.entity';
import { User } from '../user/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../common/enums/roles.enum';

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationModel: Model<ReservationDocument>;
  let userModel: Model<User>;

  const mockReservation = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    cleaner: new Types.ObjectId('507f1f77bcf86cd799439012'),
    client: new Types.ObjectId('507f1f77bcf86cd799439013'),
    date: new Date('2025-04-01T10:00:00Z'),
    Duration: 60,
    status: 'pending',
    Note: 'Test reservation',
    save: jest.fn(),
  };

  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    name: 'Test Cleaner',
    email: 'cleaner@example.com',
    roles: [Role.cleaner],
  };

  const mockClient = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'Test Client',
    email: 'client@example.com',
    roles: [],
  };

  const mockReservationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationModel = module.get<Model<ReservationDocument>>(
      getModelToken(Reservation.name),
    );
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createReservationDto: CreateReservationDto = {
      cleanerId: mockUser._id.toString(),
      date: '2025-04-01T10:00:00Z',
      duration: 60,
      notes: 'Test reservation',
      status: 'pending',
    };

    it('should create a reservation successfully', async () => {
      const savedReservation = {
        ...mockReservation,
        save: jest.fn().mockResolvedValue(mockReservation),
      };
      mockUserModel.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockClient) });
      mockReservationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      mockReservationModel.create.mockResolvedValue(savedReservation);

      const result = await service.create(
        createReservationDto,
        mockClient._id.toString(),
      );

      expect(userModel.findById).toHaveBeenCalledTimes(2);
      expect(userModel.findById).toHaveBeenNthCalledWith(
        1,
        mockUser._id.toString(),
      );
      expect(userModel.findById).toHaveBeenNthCalledWith(
        2,
        mockClient._id.toString(),
      );

      const startTime = new Date('2025-04-01T10:00:00Z');
      const endTime = new Date(startTime.getTime() + 60 * 60000); // 60 minutes in milliseconds

      expect(reservationModel.find).toHaveBeenCalledWith({
        $and: [
          { date: { $lt: endTime } },
          {
            $expr: {
              $gt: [
                { $add: ['$date', { $multiply: ['$Duration', 60000] }] },
                startTime,
              ],
            },
          },
        ],
        cleaner: mockUser._id,
        status: { $in: ['pending', 'accepted'] },
      });

      expect(reservationModel.create).toHaveBeenCalledWith({
        cleaner: mockUser._id,
        client: mockClient._id,
        date: new Date('2025-04-01T10:00:00Z'),
        Duration: 60,
        status: 'pending',
        Note: 'Test reservation',
      });
      expect(savedReservation.save).toHaveBeenCalled();
      expect(result).toEqual(mockReservation);
    });

    it('should throw BadRequestException for invalid date', async () => {
      const invalidDto = { ...createReservationDto, date: 'invalid-date' };
      await expect(
        service.create(invalidDto, mockClient._id.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid cleaner ID', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.create(createReservationDto, mockClient._id.toString()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for overlapping reservation', async () => {
      mockUserModel.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockUser) })
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockClient) });
      mockReservationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockReservation]),
      });

      await expect(
        service.create(createReservationDto, mockClient._id.toString()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all reservations for admin', async () => {
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockReservation]),
        }),
      });
      const result = await service.findAll(mockUser._id.toString(), [
        Role.Admin,
      ]);
      expect(reservationModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockReservation]);
    });

    it('should return client-specific reservations for non-admin', async () => {
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockReservation]),
        }),
      });
      const result = await service.findAll(mockClient._id.toString(), []);
      expect(reservationModel.find).toHaveBeenCalledWith({
        client: mockClient._id.toString(),
      });
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findAllReservationsCleaner', () => {
    it('should return all reservations for a cleaner', async () => {
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockReservation]),
        }),
      });
      const result = await service.findAllReservationsCleaner(
        mockUser._id.toString(),
      );
      expect(reservationModel.find).toHaveBeenCalledWith({
        cleaner: mockUser._id.toString(),
      });
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('findAllReservationsClient', () => {
    it('should return all reservations for a client', async () => {
      mockReservationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockReservation]),
        }),
      });
      const result = await service.findAllReservationsClient(
        mockClient._id.toString(),
      );
      expect(reservationModel.find).toHaveBeenCalledWith({
        client: mockClient._id.toString(),
      });
      expect(result).toEqual([mockReservation]);
    });
  });

  describe('update', () => {
    const updateReservationDto: UpdateReservationDto = {
      date: '2025-04-01T12:00:00Z',
      duration: 90,
      notes: 'Updated note',
      status: 'accepted',
    };

    it('should update a reservation successfully', async () => {
      const updatedReservation = {
        ...mockReservation,
        save: jest.fn().mockResolvedValue({
          ...mockReservation,
          date: new Date('2025-04-01T12:00:00Z'),
          Duration: 90,
          Note: 'Updated note',
          status: 'accepted',
        }),
      };
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedReservation),
      });
      mockReservationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.update(
        mockReservation._id.toString(),
        updateReservationDto,
        mockClient._id.toString(),
        [],
      );

      expect(reservationModel.findById).toHaveBeenCalledWith(
        mockReservation._id.toString(),
      );
      expect(updatedReservation.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          date: new Date('2025-04-01T12:00:00Z'),
          Duration: 90,
          Note: 'Updated note',
          status: 'accepted',
        }),
      );
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.update(
          mockReservation._id.toString(),
          updateReservationDto,
          mockClient._id.toString(),
          [],
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-pending reservation', async () => {
      const nonPendingReservation = {
        ...mockReservation,
        status: 'accepted',
        save: jest.fn(),
      };
      mockReservationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(nonPendingReservation),
      });
      await expect(
        service.update(
          mockReservation._id.toString(),
          updateReservationDto,
          mockClient._id.toString(),
          [],
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a reservation successfully', async () => {
      mockReservationModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReservation),
      });
      await service.remove(
        mockReservation._id.toString(),
        mockClient._id.toString(),
        [],
      );
      expect(reservationModel.findByIdAndDelete).toHaveBeenCalledWith(
        mockReservation._id.toString(),
      );
    });

    it('should throw NotFoundException if reservation not found', async () => {
      mockReservationModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.remove(
          mockReservation._id.toString(),
          mockClient._id.toString(),
          [],
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
