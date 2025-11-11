import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateNewUser,
  UpdateProfileDto,
  VerifyEmailDto,
} from './dto/auth.dto';
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
      const token = this.emailService.generateVerificationCode();
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

  async resendToken(email: string){
    try {
      const user = await this.prisma.user.findFirst({where: {email}})
      if(!user) throw new UnauthorizedException(`Unathorized request!`)
              const token = this.emailService.generateVerificationCode();
      const code = await bcrypt.hash(token, 10);
      const userToken = await this.prisma.verificationToken.delete({where: {userId: user.id}})
      await this.prisma.verificationToken.create({
        data: {
        token: code,
        userId: user.id,
         expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        }
      })
      await this.emailService.sendVerificationEmail(email, user.name, token);
      return `Verification token sent to user's email`
    } catch (error) {
      throw new HttpException(`$${error.message}`, HttpStatus.BAD_REQUEST)
    }
  }

  async verifyEmail(body: VerifyEmailDto) {
    try {
      const { token, userId } = body;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException(`Access denied!`);
      const userToken = await this.prisma.verificationToken.findFirst({
        where: { userId },
      });
      if (!userToken) throw new UnauthorizedException('Access denied');
      const now = new Date();
      if (userToken.expiresAt < now) {
        // Delete expired token
        // await this.prisma.verificationToken.delete({
        //   where: { id: userToken.id }
        // });
        throw new UnauthorizedException('Verification token has expired!');
      }

      const isMatch = await bcrypt.compare(token, userToken.token);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid verification token!');
      }
      await this.prisma.verificationToken.delete({where: {id: userToken.id}})
      return {message: "Email verified successfully!"}
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST)
    }
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


// {
//   "requestSuccessful": true,
//   "responseMessage": "success",
//   "responseCode": "0",
//   "responseBody": {
//     "walletName": "Staging Wallet - ref1684248425966",
//     "walletReference": "ref1684248425966",
//     "customerName": "Monnify Public Account-John Doe",
//     "customerEmail": "smekiliuwa@moniepoint.com",
//     "feeBearer": "SELF",
//     "bvnDetails": {
//       "bvn": "22199278651",
//       "bvnDateOfBirth": "1997-03-04"
//     },
//     "accountNumber": "7273449646",
//     "accountName": "Monnify Public Account-John Doe"
//   }
// }