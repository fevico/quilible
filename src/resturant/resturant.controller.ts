import { Body, Controller, Get, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ResturantService } from './resturant.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddMenuItemDto, CreateRestaurantDto } from './dto/resturant.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('resturant')
@ApiTags('Resturant')
export class ResturantController {
    constructor(private readonly restaurantService: ResturantService) {}

    @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new restaurant' })
  @ApiConsumes('multipart/form-data') // Indicate file upload
  @ApiBody({
    description: 'Restaurant registration data with optional banner file',
    type: CreateRestaurantDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The restaurant has been successfully registered.',
    schema: {
      example: {
        message: 'Restaurant registered successfully',
        name: 'Jane Doe',
        email: 'rest@example.com',
        bannerUrl: 'https://your-supabase-url/storage/v1/object/public/restaurant-banners/banner123.jpg',
      },
    },
  })
  @ApiResponse({  
    status: 400,
    description: 'Invalid input data.',
  })
  @UseInterceptors(FileInterceptor('banner')) // Intercept the 'banner' field from form-data
  async register(
    @Body() body: CreateRestaurantDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.restaurantService.register({ ...body, banner: file });
    return result;
  }  

  @Post("add-menu-item")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add a new menu item to a restaurant' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Menu item data',
        type: AddMenuItemDto
    })
    @ApiResponse({
        status: 201,
        description: 'The menu item has been successfully added.',
        schema: {
            example: {
                message: 'Menu item added successfully',
                menuItem: {
                    id: 'menuitem-uuid',
                    restaurantId: 'restaurant-uuid',
                    name: 'Pizza',
                    description: 'Delicious cheese pizza',
                    price: 9.99,
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid input data.',
    })
      @UseInterceptors(FileInterceptor('image'))
    async addMenuItem(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
      console.log(file, "file") 
      console.log(body, "form data")
        return this.restaurantService.addMenuItem({...body, image: file});
    }
    
    @Get('menu-items')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get all menu items for a restaurant' })
    @ApiResponse({
        status: 200,
        description: 'List of menu items for the restaurant.',
        schema: {
            example: [
                {
                    id: 'menuitem-uuid',
                    restaurantId: 'restaurant-uuid',
                    name: 'Pizza',
                    description: 'Delicious cheese pizza',
                    price: 9.99,
                    image: 'https://your-supabase-url/storage/v1/object/public/menu-item-images/image123.jpg',
                },
            ],
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid restaurant ID.',
    })
 
    async getResturantMenuItems(restaurantId: string) {
        return this.restaurantService.getResturantMenuItems(restaurantId);
    }
    @Get()
    getAllResturants() {
        return this.restaurantService.getAllResturants();
    }

    @Get(':id')      
    getResturantById(id: string) {
        return this.restaurantService.getResturantById(id);
    }
}
