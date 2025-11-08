import { Request } from 'express';

declare module 'express' {
  export interface Request {
    user?: {
      id: string;
      role: string;
      name: string;
      address: string;
      phone: string;
      avatar: string;
      email: string;
    };
  }
}