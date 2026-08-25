import {
    IsArray,
    IsIn,
    IsInt,
    IsNotIn,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
} from "class-validator";

export class CreateMultiCodeDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(3000)
    count: number =1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(99)
    length: number=8;

    @IsArray()
    @IsNumber(undefined, { each: true })
    decks_ids: number[];
}
