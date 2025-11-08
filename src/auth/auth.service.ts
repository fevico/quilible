import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNewUser, UpdateProfileDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async createNewUser(body: CreateNewUser) {
    try {
      const { email, password, phone, name } = body;
      const userExist = await this.prisma.user.findUnique({ where: { email } });
      if (userExist)
        throw new BadRequestException(
          'User with this credentials already exist',
        );
      const token = await this.emailService.generateVerificationCode();
      const code = await bcrypt.hash(token, 10);
      const hashPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          phone,
          password: hashPassword,
          name,
        },
      });
      await this.prisma.verificationToken.create({
        data: {
          token: code,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });
      await this.emailService.sendVerificationEmail(email, name, token);
      return {
        message: 'user registered successfully',
        name: user.name,
        email: user.email,
      };
    } catch (error) {
      throw new HttpException(
        'Could not register user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    return userData;
  }

  async loginUser(userId: string, name: string, role: string) {
    // Payload for JWT
    const payload = { userId, name, role };

    // Generate JWT token
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Access denied!');
    }

    // 2. Build a **dynamic** Prisma update payload
    const updateData: Prisma.UserUpdateInput = {};

    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.long !== undefined) updateData.long = data.long;

    // 3. If nothing to update → early return (optional)
    if (Object.keys(updateData).length === 0) {
      // You can either return the current record or throw
      return this.prisma.user.findUnique({ where: { id: userId } });
    }

    // 4. Perform the update
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        long: true,
      },
    });
  }
}
