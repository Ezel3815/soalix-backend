import { BadRequestException, UnauthorizedException } from "@nestjs/common";

export function GenerateBadRequestException(
    details: string[],
    message: string = "Bad Request",
    status = 400,
) {
    throw new BadRequestException({
        details,
        message,
        status,
    });
}
