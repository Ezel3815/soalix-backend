import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";
import { JwtConstant } from "src/constants/jwt.constant";
import { AuthService } from "src/services/auth.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        private jwtService: JwtService,
        private authService: AuthService,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const token = req.headers.authorization ?? "";

        if (token) {
            try {
                const user = await this.authService.getUserFromToken(token);
                req["user"] = user;
            } catch {
                // BUG #5: a malformed/invalid/expired token threw here and
                // crashed the request with a raw 500 ("jwt malformed").
                // Treat it as simply unauthenticated instead — whatever
                // guard requires auth on the route will return a normal 401.
                req["user"] = undefined;
            }
        }

        next();
    }
}
