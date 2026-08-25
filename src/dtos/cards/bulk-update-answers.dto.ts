import { IsInt, IsEnum, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AnswerType } from "@prisma/client";

export class UpdateAnswerDto {
    @IsInt()
    card_id: number;

    @IsEnum(AnswerType)
    answer: AnswerType;
}

export class BulkUpdateAnswersDto {
    @IsArray()
    @Type(() => UpdateAnswerDto)
    @ValidateNested({ each: true })
    answers: UpdateAnswerDto[];
}

