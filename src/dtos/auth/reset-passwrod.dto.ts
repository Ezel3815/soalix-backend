import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsEmail()
    email: string;

    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    code: string;

    @IsString()
    @MaxLength(30)
    @MinLength(6)
    password: string;
}
