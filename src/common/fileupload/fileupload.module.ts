import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileUploadService } from './fileupload.service';

@Module({
  imports: [ConfigModule],
  providers: [FileUploadService],
  exports: [FileUploadService], // Export to use in other modules
})
export class FileUploadModule {}