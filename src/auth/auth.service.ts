import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNewUser } from './dto/auth.dto';
import * as bcrypt from "bcrypt"

@Injectable()
export class AuthService {
  constructor(
     private readonly prisma: PrismaService,
     private readonly jwtService: JwtService,
    ) {}        

    async createNewUser(body: CreateNewUser){
        try {
          const {email, password, phone, name} = body 
     const userExist = await this.prisma.user.findUnique({where: {email}})
     if(userExist) throw new BadRequestException("User with this credentials already exist")
        const hashPassword = await bcrypt.hash(password, 10)
        const user = await this.prisma.user.create({
    data: {
        email,
        phone,
        password: hashPassword,
        name
    }
    })
    return {message : "user registered successfully", name: user.name, email: user.email}
        } catch (error) {
           throw new HttpException("Could not register user", HttpStatus.INTERNAL_SERVER_ERROR) 
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
} 
