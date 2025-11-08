
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  RESTAURANT = 'RESTAURANT',
  RIDER = 'RIDER',
}

export class CreateNewUser {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'Password123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  @IsOptional()
  @IsPhoneNumber()          // you can adjust the region, e.g. 'NG'
  phone?: string;

  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Anytown, USA',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'The longitude of the user',
    example: '40.7128',
  })
  @IsOptional()
  @IsString()
  long?: string;            // if you really need a “long” field (maybe longitude)
}