import { User, UserRole, UserStatus } from "@prisma/client";
import { IsEnum, IsOctal, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsEnum(UserStatus)
    status: UserStatus;

    @IsOptional()
    @IsEnum(UserRole)
    role: UserRole;
}
