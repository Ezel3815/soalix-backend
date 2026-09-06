import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(3, { message: "Username must be at least 3 characters long." })
    @MaxLength(20, { message: "Username must be at most 20 characters long." })
    username?: string;

    @IsOptional()
    @IsString()
    avatar_hair?: string;

    @IsOptional()
    @IsString()
    avatar_hair_color?: string;

    @IsOptional()
    @IsString()
    avatar_skin_color?: string;

    @IsOptional()
    @IsString()
    avatar_clothing_color?: string;

    @IsOptional()
    @IsBoolean()
    avatar_glasses?: boolean;
}
