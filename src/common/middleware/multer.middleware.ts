import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../utils/file-upload.utils';

export const ImageUploadInterceptor = () => FileInterceptor('image', multerConfig);