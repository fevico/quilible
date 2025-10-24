import { Module } from '@nestjs/common';
import { ResturantService } from './resturant.service';
import { ResturantController } from './resturant.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadModule } from 'src/common/fileupload/fileupload.module';

@Module({
  imports: [
    PrismaModule,
    FileUploadModule  
  ],
  providers: [ResturantService],
  controllers: [ResturantController]
})
export class ResturantModule {}
