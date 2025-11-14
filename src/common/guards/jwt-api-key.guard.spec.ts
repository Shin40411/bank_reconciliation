import { Test, TestingModule } from '@nestjs/testing';
import { JwtApiKeyGuard } from './jwt-api-key.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtApiKeyGuard', () => {
  let guard: JwtApiKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtApiKeyGuard,
        JwtService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<JwtApiKeyGuard>(JwtApiKeyGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
