import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

jest.mock('bcryptjs');
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerClient', () => {
    it('should throw error if email or ID number already exists', async () => {
      (prisma.client.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        service.registerClient({
          fullName: 'John',
          email: 'existing@example.com',
          phone: '+84123456789',
          password: 'password123',
          idNumber: '123456789012',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('loginClient', () => {
    it('should throw error if client not found', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.loginClient('+84123456789', 'password123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if password is invalid', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        password: 'hashed-pass',
        id: 'client-id',
        phone: '+84123456789'
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginClient('+84123456789', 'wrong-password')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return accessToken if login is successful', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue({
        password: 'hashed-pass',
        id: 'client-id',
        phone: '+84123456789'
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.loginClient('+84123456789', 'password123');

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        clientId: 'client-id',
        phone: '+84123456789'
      });
    });
  });
});
