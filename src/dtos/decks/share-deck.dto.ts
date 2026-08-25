import { IsBoolean } from "class-validator";

export class ShareDeckDto {
    @IsBoolean()
    editable: boolean;

    @IsBoolean()
    sharable: boolean;
}
