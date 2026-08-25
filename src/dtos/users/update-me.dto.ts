import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateMeDto {
    @MaxLength(30)
    @MinLength(3)
    @IsString()
    name: string;
}
