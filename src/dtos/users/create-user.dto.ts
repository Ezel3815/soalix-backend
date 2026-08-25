import { UserRole, UserStatus } from "@prisma/client";
import {
    IsEmail,
    IsEnum,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

export class CreateUserDto {
    @IsString()
    @MaxLength(30)
    @MinLength(3)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MaxLength(30)
    @MinLength(6)
    password: string;

    @IsEnum(UserRole)
    role: UserRole;
}
