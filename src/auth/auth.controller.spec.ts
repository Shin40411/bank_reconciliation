import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const authServiceMock = {
    registerClient: jest.fn(),
    loginClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.registerClient and return apiKey', async () => {
      const dto = {
        fullName: 'John Doe',
        email: 'test@example.com',
        phone: '+84123456789',
        password: 'password123',
        idNumber: '123456789012',
      };

      authService.registerClient = jest.fn().mockResolvedValue({ apiKey: 'mock-api-key' });

      const result = await controller.register(dto);

      expect(result).toEqual({ apiKey: 'mock-api-key' });
      expect(authService.registerClient).toHaveBeenCalledWith(dto);
    });

    it('should throw if service throws', async () => {
      const dto = {
        fullName: 'John Doe',
        email: 'test@example.com',
        phone: '+84123456789',
        password: 'password123',
        idNumber: '123456789012',
      };

      authService.registerClient = jest.fn().mockRejectedValue(new BadRequestException('Email exists'));

      await expect(controller.register(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should call authService.loginClient and return accessToken', async () => {
      const dto = {
        phone: '+84123456789',
        password: 'password123',
      };

      authService.loginClient = jest.fn().mockResolvedValue({ accessToken: 'mock-token' });

      const result = await controller.login(dto);

      expect(result).toEqual({ accessToken: 'mock-token' });
      expect(authService.loginClient).toHaveBeenCalledWith(dto.phone, dto.password);
    });

    it('should throw if service throws', async () => {
      const dto = {
        phone: '+84123456789',
        password: 'wrong-password',
      };

      authService.loginClient = jest.fn().mockRejectedValue(new BadRequestException('Invalid credentials'));

      await expect(controller.login(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
