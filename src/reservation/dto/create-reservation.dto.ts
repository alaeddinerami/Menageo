import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsString()
  cleanerId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  duration: number;
  
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
