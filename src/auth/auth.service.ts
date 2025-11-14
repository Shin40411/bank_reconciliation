import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { RegisterClientDto } from '../dto/auth/register-client.dto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }
    async registerClient(dto: RegisterClientDto) {
        const existing = await this.prisma.client.findFirst({
            where: {
                OR: [{ email: dto.email }, { idNumber: dto.idNumber }],
            },
        });
        if (existing) {
            throw new BadRequestException('Email or ID Number already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const apiKey = randomBytes(32).toString('hex');

        await this.prisma.client.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                idNumber: dto.idNumber,
                organizationName: dto.organizationName,
                apiKey,
            },
        });

        return { apiKey };
    }

    async loginClient(phone: string, password: string) {
        const client = await this.prisma.client.findUnique({ where: { phone } });
        if (!client) throw new BadRequestException('Invalid credentials');

        const valid = await bcrypt.compare(password, client.password);
        if (!valid) throw new BadRequestException('Invalid credentials');

        const payload = { clientId: client.id, phone: client.phone };
        const token = this.jwtService.sign(payload);

        return { accessToken: token };
    }

}
