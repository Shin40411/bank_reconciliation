import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';


jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
}));
describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: PrismaService,
          useValue: {
            transactionImportHistory: {
              create: jest.fn().mockResolvedValue({ id: 'history-id' }),
              update: jest.fn().mockResolvedValue({}),
            },
            transaction: {
              createMany: jest.fn().mockResolvedValue({}),
            },
            client: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should process CSV file successfully', async () => {
    jest.spyOn(service as any, 'processCsvFile').mockResolvedValue({
      total: 10,
      success: 10,
      failed: 0,
    });

    const result = await service.importTransactionsFromPath(
      'test.csv',
      { id: 'client-id' } as any
    );

    expect(result).toEqual({ total: 10, success: 10, failed: 0 });
    expect(prisma.transactionImportHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'history-id' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      })
    );
  });

  it('should process Excel file successfully', async () => {
    jest.spyOn(service as any, 'processExcelFile').mockResolvedValue({
      total: 10,
      success: 10,
      failed: 0,
    });

    const result = await service.importTransactionsFromPath(
      'test.xlsx',
      { id: 'client-id' } as any
    );

    expect(result).toEqual({ total: 10, success: 10, failed: 0 });
    expect(prisma.transactionImportHistory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'history-id' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      })
    );
  });

  it('should return paginated import history', async () => {
    const mockData = [
      { id: '1', fileName: 'a.csv', totalRecords: 10, successRecords: 10, failedRecords: 0 },
      { id: '2', fileName: 'b.xlsx', totalRecords: 5, successRecords: 5, failedRecords: 0 },
    ];

    prisma.transactionImportHistory.findMany = jest.fn().mockResolvedValue(mockData);
    prisma.transactionImportHistory.count = jest.fn().mockResolvedValue(2);

    const result = await service.getImportHistory('client-id', 1, 10);

    expect(result).toEqual({
      result: mockData,
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      },
    });
  });

});
