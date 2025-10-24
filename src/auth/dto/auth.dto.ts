// import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class CreateNewUser {
//   @ApiProperty({
//     description: 'The email address of the user',
//     example: 'user@example.com',
//   })
//   @IsNotEmpty()
//   @IsEmail()
//   email: string;

//   @ApiProperty({
//     description: 'The password for the user account',
//     example: 'Password123!',
//   })
//   @IsNotEmpty()
//   @IsString()
//   password: string;

//   @ApiProperty({
//     description: 'The phone number of the user',
//     example: '+1234567890',
//   })
//   @IsNotEmpty()
//   @IsString()
//   phone: string;

//   @ApiProperty({
//     description: 'The full name of the user',
//     example: 'John Doe',
//   })
//   @IsNotEmpty()
//   @IsString()
//   name: string;
// }


import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
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