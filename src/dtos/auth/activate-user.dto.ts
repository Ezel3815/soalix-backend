import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class ActivateUserDto {
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    code: string;

    @IsEmail()
    email: string;
}
