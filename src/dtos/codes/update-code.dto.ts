import {
    IsArray,
    IsNotIn,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength,
} from "class-validator";

export class UpdateCodeDto {
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(20)
    code: string;

    @IsArray()
    @IsNumber(undefined, { each: true })
    decks_ids: number[];
}
