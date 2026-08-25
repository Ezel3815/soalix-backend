import { CardType } from "@prisma/client";
import {
    IsEnum,
    IsInt,
    IsObject,
    IsString,
    IsOptional,
    ValidateIf,
} from "class-validator";

export class UpdateCardDto {
    @IsEnum(CardType)
    type: CardType;

    @IsOptional()
    @IsString()
    document_name: string;

    @ValidateIf((obj) => obj.document_name)
    @IsString()
    document_title: string;

    @IsOptional()
    @IsString()
    back_image_name: string;

    @IsOptional()
    @IsString()
    front_image_name: string;

    @IsObject()
    data: object;
}
