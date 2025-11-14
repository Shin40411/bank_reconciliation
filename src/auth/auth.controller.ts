import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterClientDto } from '../dto/auth/register-client.dto';
import { LoginClientDto } from '../dto/auth/login-client.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register-client')
    async register(@Body() dto: RegisterClientDto) {
        return this.authService.registerClient(dto);
    }

    @Post('login-client')
    async login(@Body() dto: LoginClientDto) {
        return this.authService.loginClient(dto.phone, dto.password);
    }
}
