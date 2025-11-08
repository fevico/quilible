import { Body, Controller, Post, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateNewUser, UpdateProfileDto } from './dto/auth.dto';
import { AuthGuard } from 'src/gurad/auth';
import type { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateNewUser })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
        phone: '+1234567890',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data (e.g., invalid email or missing fields).',
  })
  async createUser(@Body() body: CreateNewUser) {
    return this.authService.createNewUser(body);
  } 

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user and return a JWT token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'Password123!' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in, returns JWT token.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials (e.g., wrong email or password).',
  })
  async login(@Body() body: { email: string; password: string }) {
    // Validate user credentials
    const user = await this.authService.validateUser(body.email, body.password);
      
    // Generate JWT token
    return this.authService.loginUser(user.id, user.name, user.role);
  }

  @Post('update')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access.',
  })
  async updateProfile(@Body() body: UpdateProfileDto, @Req() req: Request) {
    const userId = req.user?.id as string;
    return this.authService.updateProfile(userId, body);
  }
}