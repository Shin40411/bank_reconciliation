import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginClientDto {
    @IsPhoneNumber()
    phone: string;

    @IsNotEmpty()
    password: string;
}
