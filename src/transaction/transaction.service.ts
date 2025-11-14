import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Client } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import * as ExcelJS from 'exceljs';
import { TransactionRow } from '../types/transaction';
import { parseExcelDate } from '../common/utils/excel.utils';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    async getImportHistory(
        clientId: string,
        page = 1,
        pageSize = 20
    ) {
        const skip = (page - 1) * pageSize;

        const [data, total] = await Promise.all([
            this.prisma.transactionImportHistory.findMany({
                where: { clientId },
                orderBy: { importedAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.transactionImportHistory.count({
                where: { clientId },
            }),
        ]);

        return {
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
            result: data,
        };
    }

    async importTransactionsFromPath(filePath: string, client: Client) {
        const fileName = path.basename(filePath);
        const importHistory = await this.createImportHistory(client, fileName);

        try {
            let result: { total: number; success: number; failed: number } = {
                total: 0,
                success: 0,
                failed: 0,
            };

            if (fileName.endsWith('.csv')) {
                result = await this.processCsvFile(filePath, client);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                result = await this.processExcelFile(filePath, client);
            } else {
                throw new BadRequestException('Unsupported file type');
            }

            console.log(result);

            await this.prisma.transactionImportHistory.update({
                where: { id: importHistory.id },
                data: {
                    totalRecords: result.total,
                    successRecords: result.success,
                    failedRecords: result.failed,
                    status: result.failed === 0 ? 'SUCCESS' : 'FAILED',
                    importedAt: new Date(),
                },
            });

            return result;
        } catch (error) {
            if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
            await this.prisma.transactionImportHistory.update({
                where: { id: importHistory.id },
                data: {
                    status: 'FAILED',
                    importedAt: new Date(),
                },
            });
            throw error;
        }
    }

    private async createImportHistory(client: Client, fileName: string) {
        return this.prisma.transactionImportHistory.create({
            data: {
                clientId: client.id,
                fileName,
                totalRecords: 0,
                successRecords: 0,
                failedRecords: 0,
                status: 'PENDING',
            },
        });
    }

    private async processCsvFile(filePath: string, client: Client) {
        let total = 0, success = 0, failed = 0;
        const batchSize = 500;
        let batch: Prisma.TransactionCreateManyInput[] = [];

        const processRow = async (row: TransactionRow) => {
            total++;
            if (!row.date || !row.content || !row.amount || !row.type) {
                failed++; return;
            }
            const { date, content, amount, type } = row;

            batch.push({
                clientId: client.id,
                date: new Date(date),
                content,
                amount: typeof amount === 'string' ? parseFloat(amount) : amount,
                type,
            });
            if (batch.length >= batchSize) {
                await this.prisma.transaction.createMany({ data: batch });
                success += batch.length; batch = [];
            }
        };

        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv.parse({ headers: true }))
                .on('error', reject)
                .on('data', (row: TransactionRow) => processRow(row))
                .on('end', async () => {
                    if (batch.length > 0) {
                        await this.prisma.transaction.createMany({ data: batch });
                        success += batch.length;
                    }
                    resolve();
                });
        });

        return { total, success, failed };
    }

    private async processExcelFile(filePath: string, client: Client) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];

        let total = 0, success = 0, failed = 0;
        const batchSize = 500;
        let batch: Prisma.TransactionCreateManyInput[] = [];

        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            total++;

            const date = parseExcelDate(row.getCell(1).value);
            const content = row.getCell(2).text;
            const amount = parseFloat(row.getCell(3).text);
            const type = row.getCell(4).text.trim();

            if (!date || isNaN(amount) || !type) {
                failed++;
                continue;
            }

            batch.push({ clientId: client.id, date, content, amount, type });

            if (batch.length >= batchSize) {
                await this.prisma.transaction.createMany({ data: batch });
                success += batch.length;
                batch = [];
            }
        }

        if (batch.length > 0) {
            await this.prisma.transaction.createMany({ data: batch });
            success += batch.length;
        }

        return { total, success, failed };
    }
}
