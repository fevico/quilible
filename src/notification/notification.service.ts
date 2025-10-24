import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {
    // Initialize Firebase Admin
    // if (!admin.apps.length) { 
    //   admin.initializeApp({
    //     credential: admin.credential.cert({
    //       projectId: process.env.FIREBASE_PROJECT_ID,
    //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    //     }),
    //   });
    //   this.logger.log('Firebase Admin initialized successfully');
    // }
  }

  async sendPushNotification(notification: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>; // More specific type
  }): Promise<void> {
    try {
      const userToken = await this.getUserFCMToken(notification.userId);
      
      if (!userToken) {
        this.logger.warn(`No FCM token found for user ${notification.userId}`);
        return;
      }

      const message: admin.messaging.Message = {
        token: userToken,
        notification: {
          title: notification.title,
          body: notification.body,
        }, 
        data: notification.data,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully to user ${notification.userId}: ${response}`);
      
    } catch (error) {
      this.logger.error(`Error sending push notification to user ${notification.userId}:`, error);
      // You might want to handle specific Firebase errors here
    }
  }

  private async getUserFCMToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    
    return user?.fcmToken || null;
  }

  // Optional: Method to save FCM token
  async saveFCMToken(userId: string, fcmToken: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });
      this.logger.log(`FCM token saved for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error saving FCM token for user ${userId}:`, error);
      throw error;
    }
  }
}