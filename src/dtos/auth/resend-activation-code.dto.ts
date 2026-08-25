import { IsEmail } from "class-validator";

export class ResendActivationCodeDto {
    @IsEmail()
    email: string;
}
