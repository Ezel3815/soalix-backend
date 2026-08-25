import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
} from "@nestjs/common";
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

        console.log(`${req.method}: ${req.originalUrl}`);
        console.log(req.body);

        if (token) {
            const user = await this.authService.getUserFromToken(token);
            req["user"] = user;
        }

        next();
    }
}
