import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TransactionModule } from './transaction/transaction.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransactionModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
