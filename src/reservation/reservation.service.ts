import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation, ReservationDocument } from './entities/reservation.entity';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/common/enums/roles.enum';
import { log } from 'console';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createReservationDto: CreateReservationDto, clientId: string): Promise<Reservation> {
    const { cleanerId, date, duration, notes } = createReservationDto;
    // console.log('Input:', { cleanerId, date, duration, notes });
  
    const requestedStart = new Date(date);
    if (isNaN(requestedStart.getTime())) {
      throw new BadRequestException('Invalid date format');
    }
    if (duration <= 0 || !Number.isInteger(duration)) {
      throw new BadRequestException('Duration must be a positive integer');
    }
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60 * 1000);
  
    const cleaner = await this.userModel.findById(cleanerId).exec();
    if (!cleaner || !cleaner.roles.includes(Role.cleaner)) {
      throw new BadRequestException('Invalid cleaner ID');
    }
    const client = await this.userModel.findById(clientId).exec();
    if (!client) {
      throw new BadRequestException('Invalid client ID');
    }
  
    
      const cleanerOverlaps = await this.reservationModel.find({
      cleaner: cleaner._id,
      status: { $in: ['pending', 'accepted'] },
      $and: [
        { date: { $lt: requestedEnd } },
        {
          $expr: {
            $gt: [
              { $add: ['$date', { $multiply: ['$Duration', 60 * 1000] }] },
              requestedStart,
            ],
          },
        },
      ],
    }).exec();
  
  
    if (cleanerOverlaps.length > 0) {
      throw new BadRequestException('Cleaner is already booked at this time');
    }
    const reservation = await this.reservationModel.create({
      cleaner: cleaner._id,
      client: client._id,
      date: requestedStart,
      Duration: duration,
      status: 'pending',
      Note: notes,
    });
 return await reservation.save();
  }

  async findAll(userId: string, userRoles: Role[]): Promise<Reservation[]> {
    if (userRoles.includes(Role.Admin)) {
      return this.reservationModel.find().populate('cleaner client').exec();
    }
    return this.reservationModel.find({ client: userId }).populate('cleaner').exec();
  }

  async findOne(id: string): Promise<Reservation[]> {
    try {
      const reservations = await this.reservationModel.find({ cleaner: new this.reservationModel.base.Types.ObjectId(id) }).select('date').exec();
      // console.log('Reservations:', reservations);
     
      return reservations;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }


  
  async findAllReservationsCleaner(userId: string): Promise<Reservation[]> {


    return this.reservationModel.find({ cleaner: userId }).populate('client').exec();
  }


  async update(id: string, updateReservationDto: UpdateReservationDto, userId: string, userRoles: Role[]): Promise<Reservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    if (reservation.status !== 'pending') {
      throw new BadRequestException('Can only update pending reservations');
    }

    const { date, duration, notes, status } = updateReservationDto;

    if (date || duration) {
      const requestedStart = date ? new Date(date) : reservation.date;
      const newDuration = duration ?? reservation.Duration;
      
      if (isNaN(requestedStart.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (newDuration <= 0 || !Number.isInteger(newDuration)) {
        throw new BadRequestException('Duration must be a positive integer');
      }

      const requestedEnd = new Date(requestedStart.getTime() + newDuration * 60 * 1000);

      const cleanerOverlaps = await this.reservationModel.find({
        cleaner: reservation.cleaner,
        _id: { $ne: reservation._id }, 
        status: { $in: ['pending', 'accepted'] },
        $and: [
          { date: { $lt: requestedEnd } },//date is less than requested end
          {
            $expr: {
              $gt: [
                { $add: ['$date', { $multiply: ['$Duration', 60 * 1000] }] },
                requestedStart,
              ],
            },
          },
        ],
      }).exec();

      if (cleanerOverlaps.length > 0) {
        throw new BadRequestException('Cleaner is already booked at this time');
      }

      if (date) reservation.date = requestedStart;
      if (duration) reservation.Duration = newDuration;
    }

    if (notes !== undefined) reservation.Note = notes;
    if (status) {
      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        throw new BadRequestException('Invalid status value');
      }
      reservation.status = status;
    }

    const updatedReservation = await reservation.save();
    console.log('Updated Reservation:', updatedReservation);
    return updatedReservation;
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