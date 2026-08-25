import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RequestResetPasswordDto {
    @IsEmail()
    email: string;
}
