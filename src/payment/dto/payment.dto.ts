import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ItemDto {
  @ApiProperty({
    description: 'Unique identifier for the menu item',
    example: 'febde60e-2eb4-4017-acb7-897bc28b67a2'
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({
    description: 'Quantity of the menu item',
    example: 3,
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class PaymentIntent {
  @ApiProperty({
    description: 'Array of menu items to order',
    type: [ItemDto],
    example: [{
      itemId: 'febde60e-2eb4-4017-acb7-897bc28b67a2',
      quantity: 3
    }]
  })
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => ItemDto)
  @IsNotEmpty()
  items: ItemDto[];

  @ApiProperty({
    description: 'Unique identifier for the kitchen',
    example: '3bcafc39-d778-492b-90a2-fed2a5a23076'
  })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'james@mail.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Total amount for the order in Naira',
    example: 400,
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}