import { Body, Controller, Post, Put } from "@nestjs/common";
import { ActivateUserDto } from "src/dtos/auth/activate-user.dto";
import { LoginDto } from "src/dtos/auth/login.dto";
import { RegisterDto } from "src/dtos/auth/register.dto";
import { RequestResetPasswordDto } from "src/dtos/auth/request-reset-password.dto";
import { ResetPasswordDto } from "src/dtos/auth/reset-passwrod.dto";
import { AuthService } from "src/services/auth.service";
import { ApiTags } from "@nestjs/swagger";
import { ResendActivationCodeDto } from "src/dtos/auth/resend-activation-code.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private service: AuthService) {}

    @Post("register")
    register(@Body() registerDto: RegisterDto) {
        return this.service.regiser(registerDto);
    }

    @Post("register-without-code")
    registerWithoutCode(@Body() registerDto: RegisterDto) {
        return this.service.regiserWithOutCode(registerDto);
    }

    @Post("login")
    login(@Body() loginDto: LoginDto) {
        return this.service.login(loginDto);
    }

    @Post("resed-activation-code")
    resedActivationCode(
        @Body() resendActivationCodeDto: ResendActivationCodeDto,
    ) {
        return this.service.resedActivationCode(resendActivationCodeDto);
    }

    @Put("request-reset-password")
    requestRestPassword(
        @Body() requestResetPasswordDto: RequestResetPasswordDto,
    ) {
        return this.service.requestRestPassword(requestResetPasswordDto);
    }

    @Put("reset-password")
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.service.resetPassword(resetPasswordDto);
    }

    @Put("activate")
    activate(@Body() activateUserDto: ActivateUserDto) {
        return this.service.activateUser(activateUserDto);
    }
}
