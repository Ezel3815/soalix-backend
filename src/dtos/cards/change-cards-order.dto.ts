import { IsArray, IsInt } from "class-validator";

export class ChangeCardsOrderDto {
    @IsArray()
    @IsInt({ each: true })
    cards_ids: number[];
}
