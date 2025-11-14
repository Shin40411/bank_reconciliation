import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

@Processor('transaction-import')
export class TransactionQueueProcessor {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly prisma: PrismaService
    ) { }

    @Process()
    async handleTransactionImport(job: Job<{ filePath: string; clientId: string }>) {
        const { filePath, clientId } = job.data;

        const client = await this.prisma.client.findUnique({ where: { id: clientId } });
        if (!client) throw new BadRequestException(`Client ${clientId} not found`);

        return this.transactionService.importTransactionsFromPath(filePath, client);
    }
}
