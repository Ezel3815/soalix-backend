import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { GenerateUnauthorizedException } from "src/exception/unauthorized.exception";

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (!request["user"] || request["user"].status != UserStatus.ACTIVE) {
            throw GenerateUnauthorizedException(["Please login first"]);
        }

        return true;
    }
}
