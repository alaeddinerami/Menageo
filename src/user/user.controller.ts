import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enums/roles.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ImageUploadInterceptor } from 'src/common/middleware/multer.middleware';

@Controller('user')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseInterceptors(ImageUploadInterceptor())
  create(@Body() createUserDto: CreateUserDto,     @UploadedFile() image: Express.Multer.File,) {
    return this.userService.create(createUserDto, image); 
  }

  @Get()
  findAll() {
    return this.userService.findAll(); 
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id); 
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto); 
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id); 
  }
}