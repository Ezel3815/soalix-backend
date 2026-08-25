import { UnauthorizedException } from "@nestjs/common";

export function GenerateUnauthorizedException(
    details: string[],
    message: string = "Unauthorized",
    status = 401,
) {
    throw new UnauthorizedException({
        details,
        message,
        status,
    });
}
