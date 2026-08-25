import { IsEnum } from "class-validator";
import { AnswerType } from "@prisma/client";

export class AnswerCardDto {
    @IsEnum(AnswerType)
    answer: AnswerType;
}
