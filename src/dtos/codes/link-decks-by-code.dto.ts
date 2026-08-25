import { IsString } from "class-validator";

export class LinkDecksByCodeDto {
    @IsString()
    code: string;
}
