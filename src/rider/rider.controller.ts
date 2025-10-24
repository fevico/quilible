import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { RiderService } from './rider.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateRiderDto } from './dto/rider.dto';

@ApiTags('Rider')
@Controller('rider')
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Post('register')     
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new rider' })
  @ApiBody({ type: CreateRiderDto })
  @ApiResponse({
    status: 201,    
    description: 'The rider has been successfully registered.',
    schema: {
      example: {
        message: 'Rider registered successfully',
        name: 'Bob Doe',
        email: 'rider@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async register(@Body() body: CreateRiderDto) {
    return this.riderService.register(body);
  }

  
}