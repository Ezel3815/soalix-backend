import {
    BadRequestException,
    UnauthorizedException,
    UnprocessableEntityException,
} from "@nestjs/common";

export function GenerateUnprocessableEntityException(
    details: string[],
    message: string = "Unprocessable Entity",
    status = 422,
) {
    throw new UnprocessableEntityException({
        details,
        message,
        status,
    });
}
