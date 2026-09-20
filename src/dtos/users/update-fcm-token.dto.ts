import { IsOptional, IsString } from "class-validator";

export class UpdateFcmTokenDto {
    // Sent as an empty string / omitted to CLEAR the saved token on
    // logout — not required to be a real token, so no MinLength here.
    @IsOptional()
    @IsString()
    token?: string;
}
