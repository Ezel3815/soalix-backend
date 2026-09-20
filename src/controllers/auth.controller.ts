import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ActivateUserDto } from "src/dtos/auth/activate-user.dto";
import { LoginDto } from "src/dtos/auth/login.dto";
import { RegisterDto } from "src/dtos/auth/register.dto";
import { RequestResetPasswordDto } from "src/dtos/auth/request-reset-password.dto";
import { ResetPasswordDto } from "src/dtos/auth/reset-passwrod.dto";
import { AuthService } from "src/services/auth.service";
import { ApiTags } from "@nestjs/swagger";
import { ResendActivationCodeDto } from "src/dtos/auth/resend-activation-code.dto";
import { GenerateBadRequestException } from "src/exception/bad-request.exception";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
    constructor(private service: AuthService) {}

    @Get("username-available/:username")
    usernameAvailable(@Param("username") username: string) {
        return this.service.isUsernameAvailable(username);
    }

    // A race (two people taking the same username at once) would otherwise
    // surface as a 500 from the DB unique constraint; return a clear 400.
    private async handleUnique<T>(action: () => Promise<T>): Promise<T> {
        try {
            return await action();
        } catch (e: any) {
            if (e?.code === "P2002") {
                const target = String(e?.meta?.target ?? "");
                if (target.includes("username")) {
                    GenerateBadRequestException(["Username already taken"]);
                }
                if (target.includes("email")) {
                    GenerateBadRequestException(["Email already exists"]);
                }
            }
            throw e;
        }
    }

    @Post("register")
    register(@Body() registerDto: RegisterDto) {
        return this.handleUnique(() => this.service.regiser(registerDto));
    }

    @Post("register-without-code")
    registerWithoutCode(@Body() registerDto: RegisterDto) {
        return this.handleUnique(() =>
            this.service.regiserWithOutCode(registerDto),
        );
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
