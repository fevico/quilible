import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRestaurantDto {
  @ApiProperty({
    description: 'The email address of the restaurant owner',
    example: 'rest@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password for the restaurant owner account',
    example: 'Password123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'The phone number of the restaurant owner',
    example: '+1234567891',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'The full name of the restaurant owner',
    example: 'Jane Doe',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The address of the restaurant',
    example: '123 Food St',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'The banner file for the restaurant (multipart/form-data)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  banner?: Express.Multer.File; // Updated to handle file
}

export class AddMenuItemDto {
  @ApiProperty({
    description: 'The ID of the restaurant',
    example: 'restaurant-uuid',
  })
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
    @ApiProperty({
    description: 'The name of the menu item',
    example: 'Pizza',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
    @ApiProperty({
    description: 'The description of the menu item',
    example: 'Delicious cheese pizza',
  })
    @IsOptional()
    @IsString()
    description?: string;
    @ApiProperty({
    description: 'The price of the menu item',
    example: 9.99,
  })
  @IsNotEmpty()
  price: number;

    @ApiProperty({
    description: 'The image file for the item (multipart/form-data)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image: Express.Multer.File; // Updated to handle file
}