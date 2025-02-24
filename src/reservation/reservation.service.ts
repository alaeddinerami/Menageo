import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation } from './entities/reservation.entity';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel('Reservation') private reservationModel: Model<Reservation>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async create(createReservationDto: CreateReservationDto, clientId: string): Promise<Reservation> {
    const { cleanerId, date, duration, notes } = createReservationDto;

    const cleaner = await this.userModel.findById(cleanerId).exec();
    if (!cleaner || !cleaner.roles.includes(Role.cleaner)) {
      throw new BadRequestException('Invalid cleaner ID');
    }

    const client = await this.userModel.findById(clientId).exec();
    if (!client) throw new BadRequestException('Invalid client ID');

    // Calculate the end time of the requested reservation
    const requestedStart = new Date(date);
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60 * 1000);

    // Check for overlapping reservations
    const overlappingReservations = await this.reservationModel.find({
      cleaner: cleanerId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        {
          date: { $lte: requestedEnd },
          $expr: { $gte: [{ $add: ['$date', { $multiply: ['$duration', 60 * 1000] }]}, requestedStart] },
        },
      ],
    }).exec();

    if (overlappingReservations.length > 0) {
      throw new BadRequestException('Cleaner is already booked at this time');
    }

    const reservation = new this.reservationModel({
      cleaner,
      client,
      date: requestedStart,
      duration,
      status: 'pending',
      notes,
    });

    return reservation.save();
  }

  async findAll(userId: string, userRoles: Role[]): Promise<Reservation[]> {
    if (userRoles.includes(Role.Admin)) {
      return this.reservationModel.find().populate('cleaner client').exec();
    }
    return this.reservationModel.find({ client: userId }).populate('cleaner').exec();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).populate('cleaner client').exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto, userId: string, userRoles: Role[]): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (!userRoles.includes(Role.Admin) && reservation.client.toString() !== userId) {
      throw new BadRequestException('Unauthorized to modify this reservation');
    }

    const { date, duration } = updateReservationDto;
    const newDate = date ? new Date(date) : reservation.date;
    const newDuration = duration !== undefined ? duration : reservation.Duration;

    const requestedStart = newDate;
    const requestedEnd = new Date(requestedStart.getTime() + newDuration * 60 * 1000);

    // Check for overlaps, excluding the current reservation
    const overlappingReservations = await this.reservationModel.find({
      cleaner: reservation.cleaner,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: id },
      $or: [
        {
          date: { $lte: requestedEnd },
          $expr: { $gte: [{ $add: ['$date', { $multiply: ['$duration', 60 * 1000] }]}, requestedStart] },
        },
      ],
    }).exec();

    if (overlappingReservations.length > 0) {
      throw new BadRequestException('Cleaner is already booked at this time');
    }

    reservation.date = newDate;
    reservation.Duration = newDuration;
    return reservation.save();
  }

  async remove(id: string, userId: string, userRoles: Role[]): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    if (!userRoles.includes(Role.Admin) && reservation.client.toString() !== userId) {
      throw new BadRequestException('Unauthorized to cancel this reservation');
    }

    reservation.status = 'cancelled';
    return reservation.save();
  }
}