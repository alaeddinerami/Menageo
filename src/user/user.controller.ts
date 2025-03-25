import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/roles.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ImageUploadInterceptor } from '../common/middleware/multer.middleware';

@Controller('user')
@UseGuards(AuthGuard('jwt'), RolesGuard)
// @Roles(Role.Admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseInterceptors(ImageUploadInterceptor())
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.userService.create(createUserDto, image);
  }

  @Get()
  // @Roles(Role.Admin, Role.client)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  // @Roles(Role.Admin, Role.client)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(ImageUploadInterceptor())
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,//
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.userService.update(id, updateUserDto, image);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
