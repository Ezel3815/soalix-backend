import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MaxLength(30)
    @MinLength(6)
    password: string;
}
