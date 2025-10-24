import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AddMenuItemDto, CreateRestaurantDto } from './dto/resturant.dto';
import { FileUploadService } from 'src/common/fileupload/fileupload.service';

@Injectable()
export class ResturantService {
    constructor(private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,   
) {} 

async register(body: CreateRestaurantDto) {
    const { email, password, phone, name, address, banner } = body;

    try {
           // Check if user with email exists
    const userExist = await this.prisma.user.findUnique({ where: { email } });
    if (userExist) throw new BadRequestException('User with this email already exists');

    const hashPassword = await bcrypt.hash(password, 10); 

    let bannerUrl: string | undefined;

    // Handle file upload to Supabase if present
    if (banner) {
      bannerUrl = await this.fileUploadService.uploadFile(banner, 'restaurant-banners');
    }

    // Transaction to create User and Restaurant
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,    
          password: hashPassword,
          phone,
          name,
          address,   
        },
      });

      await tx.restaurant.create({   
        data: {
          userId: newUser.id,
          name: `${newUser.name}'s Restaurant`, // Default name
          address,
          banner: bannerUrl, 
        },
      });

      return newUser;
    });

    return { message: 'Restaurant registered successfully', name: user.name, user:user, email: user.email, bannerUrl }; 
    } catch (error) {
        console.log(error)
        throw new HttpException("Could not register restaurant", 500);
    }
  }


   async  getAllResturants() {
    try {    
        const resturants = await this.prisma.restaurant.findMany();
        return resturants;
    } catch (error) {
        throw new HttpException("Could not fetch resturants", 500);
    }
   }   

   async getResturantById(id: string) {  
    try {
        const resturant = await this.prisma.restaurant.findUnique({ where: { id } });
        if (!resturant) {
            throw new HttpException("Resturant not found", 404);
        }
        return resturant;
    } catch (error) {
        throw new HttpException("Could not fetch resturant", 500);
    }
    }

    async addMenuItem(body: any) {
    const { restaurantId, name, description, price, image } = body;
    
    try {  
            // Check if restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    let imageUrl: string | undefined;

    // Handle file upload to Supabase if present
    if (image) {
      imageUrl = await this.fileUploadService.uploadFile(image, 'menu-item-images');
    }

    const parsePrice = parseInt(price, 10)

    // Create Menu Item 
    const menuItem = await this.prisma.menuItem.create({
      data: {
        restaurant: {connect: {id: restaurantId}},
        name,
        description,
        price: parsePrice,
        image: imageUrl,
      },
    });

    return { message: 'Menu item added successfully', menuItem };
    } catch (error: any) {
        throw new HttpException(`${error.message}`, 500);
    }
  
  }
    
   async getResturantMenuItems(restaurantId: string) {
    try {
        const menuItems = await this.prisma.menuItem.findMany({ where: { restaurantId } });
        return menuItems;
    } catch (error) {
        throw new HttpException("Could not fetch menu items", 500);
    }
    }   
}
