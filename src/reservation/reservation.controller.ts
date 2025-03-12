import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('reservations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.client)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Request() req, @Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto, req.user._id);
  }

  @Get()
  findAll(@Request() req) {
    return this.reservationService.findAll(req.user._id, req.user.roles);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('id2:', id);
    return this.reservationService.findOne(id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationService.update(id, updateReservationDto, req.user._id, req.user.roles);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.reservationService.remove(id, req.user._id, req.user.roles);
  }
}