import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdatePasswordDto {
    @MaxLength(30)
    @MinLength(6)
    @IsString()
    old_password: string;

    @MaxLength(30)
    @MinLength(6)
    @IsString()
    new_password: string;
}
