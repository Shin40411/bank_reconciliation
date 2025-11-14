import { Controller, Get, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtApiKeyGuard } from '../common/guards/jwt-api-key.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { TransactionService } from './transaction.service';

@Controller('transaction')
@UseGuards(JwtApiKeyGuard)
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService,
        @InjectQueue('transaction-import') private readonly queue: Queue
    ) { }

    @Get('history')
    async getImportHistory(
        @Req() req: Request,
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20
    ) {
        const client = req.client!;
        const histories = await this.transactionService.getImportHistory(client.id, Number(page), Number(pageSize));
        return { message: 'Import history fetched', data: histories };
    }

    @Post('import')
    @UseInterceptors(FilesInterceptor('files', 5, {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB/file maximum
    }))
    async importTransactions(@UploadedFiles() files: Express.Multer.File[], @Req() req: Request) {
        const client = req.client!;
        const results: { fileName: string; status: string }[] = [];

        for (const file of files) {
            if (!['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.mimetype)) {
                results.push({ fileName: file.originalname, status: 'REJECTED: Invalid file type' });
                continue;
            }
            const filePath = this.saveFile(file);
            await this.queue.add({ filePath, clientId: client.id });
            results.push({ fileName: file.originalname, status: 'QUEUED' });
        }

        return { message: 'Files processed for queueing', data: results };
    }

    private saveFile(file: Express.Multer.File): string {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const ext = path.extname(file.originalname);
        const fileName = `${randomUUID()}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, file.buffer);

        return filePath;
    }
}
