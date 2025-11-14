import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, Length, Matches } from 'class-validator';

export class RegisterClientDto {
    @IsNotEmpty()
    fullName: string;

    @IsEmail()
    email: string;

    @IsPhoneNumber()
    phone: string;

    @IsNotEmpty()
    @Length(6, 20)
    password: string;

    @IsNotEmpty()
    @Matches(/^\d{12}$/, { message: 'idNumber must be 12 digits' })
    idNumber: string;

    @IsOptional()
    organizationName?: string;
}
