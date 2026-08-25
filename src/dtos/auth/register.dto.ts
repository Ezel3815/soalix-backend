import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";


export class RegisterDto {
    @IsString({ message: 'Name must be a string.' })
    @MinLength(3, { message: 'Name must be at least 3 characters long.' })
    @MaxLength(30, { message: 'Name must be at most 30 characters long.' })
    name: string;

    @IsEmail({}, { message: 'Email must be a valid email address.' })
    email: string;

    @IsString({ message: 'Password must be a string.' })
    @MinLength(6, { message: 'Password must be at least 6 characters long.' })
    @MaxLength(30, { message: 'Password must be at most 30 characters long.' })
    password: string;
}
