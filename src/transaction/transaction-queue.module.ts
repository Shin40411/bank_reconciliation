import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TransactionQueueProcessor } from './transaction-queue.processor';
import { TransactionModule } from './transaction.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'transaction-import' }),
    forwardRef(() => TransactionModule),
  ],
  providers: [TransactionQueueProcessor],
  exports: [BullModule],
})
export class TransactionQueueModule { }
