import { Client } from '@prisma/client';
import { Request } from 'express';

declare module 'express' {
  interface Request {
    client?: Client;
  }
}