import { IsString } from "class-validator";

export class LinkByShareCodeDto {
    @IsString()
    code: string;
}
