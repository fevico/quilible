import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiderDto {
  @ApiProperty({
    description: 'The email address of the rider',
    example: 'rider@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the rider account',
    example: 'Password123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The phone number of the rider',
    example: '+1234567892',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'The full name of the rider',
    example: 'Bob Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The rider’s license number',
    example: 'R12345',
  })
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'The type of vehicle used by the rider',
    example: 'Bike',
  })
  @IsNotEmpty()
  @IsString()
  vehicleType: string;
}