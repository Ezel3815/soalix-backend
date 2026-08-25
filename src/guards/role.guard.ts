import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { UserRole, User } from "@prisma/client";
import { GenerateUnauthorizedException } from "src/exception/unauthorized.exception";

@Injectable()
export class RoleGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (
            !request["user"] ||
            !((request["user"] as User)?.role == UserRole.ADMIN)
        ) {
            throw GenerateUnauthorizedException(["Your not an admin"]);
        }

        return true;
    }
}
