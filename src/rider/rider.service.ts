import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRiderDto } from './dto/rider.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RiderService {
  constructor(private readonly prisma: PrismaService) {}
 
  async register(body: CreateRiderDto) {
    const { email, password, phone, name, licenseNumber, vehicleType } = body;
   
    // Check if user with email exists
    const userExist = await this.prisma.user.findUnique({ where: { email } });
    if (userExist) throw new BadRequestException('User with this email already exists');

    const hashPassword = await bcrypt.hash(password, 10);

    // Transaction to create User and Rider
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashPassword,
          phone,
          name,
        },
      });

      await tx.rider.create({
        data: {
          userId: newUser.id,
          licenseNumber,
          vehicleType,
        },
      });

      return newUser;
    });

    return { message: 'Rider registered successfully', name: user.name, email: user.email };
  }
}