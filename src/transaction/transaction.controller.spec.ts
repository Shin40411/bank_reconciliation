import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { TransactionService } from './transaction.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionController', () => {
  let controller: TransactionController;
  let queue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: {
            getImportHistory: jest.fn(),
          },
        },
        {
          provide: getQueueToken('transaction-import'),
          useValue: {
            add: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            client: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    })
      .overrideGuard(require('../common/guards/jwt-api-key.guard').JwtApiKeyGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TransactionController>(TransactionController);
    queue = module.get<Queue>(getQueueToken('transaction-import'));
  });

  it('should queue valid files', async () => {
    const mockFiles = [
      { originalname: 'a.csv', mimetype: 'text/csv', buffer: Buffer.from('') },
      { originalname: 'b.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('') },
    ];

    const mockReq: any = { client: { id: 'client-id' } };

    const result = await controller.importTransactions(mockFiles as any, mockReq);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].status).toBe('QUEUED');
    expect(queue.add).toHaveBeenCalledTimes(2);
  });

  it('should reject invalid files', async () => {
    const mockFiles = [{ originalname: 'c.txt', mimetype: 'text/plain', buffer: Buffer.from('') }];
    const mockReq: any = { client: { id: 'client-id' } };

    const result = await controller.importTransactions(mockFiles as any, mockReq);
    expect(result.data[0].status).toMatch(/REJECTED/);
    expect(queue.add).not.toHaveBeenCalled();
  });
});
