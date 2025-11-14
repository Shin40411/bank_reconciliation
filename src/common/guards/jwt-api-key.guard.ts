import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtApiKeyGuard implements CanActivate {
  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      const client = await this.prisma.client.findUnique({ where: { apiKey } });
      if (!client) throw new UnauthorizedException('Invalid API key');
      request['client'] = client;
      return true;
    }

    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      const client = await this.prisma.client.findUnique({ where: { id: payload.clientId } });
      if (!client) throw new UnauthorizedException('Client not found');
      request['client'] = client;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
