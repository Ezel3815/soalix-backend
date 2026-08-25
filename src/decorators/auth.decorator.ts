import { UseGuards, applyDecorators } from "@nestjs/common";
import { ApiBasicAuth } from "@nestjs/swagger";
import { AuthGuard } from "src/guards/auth.guard";

export function DAuth() {
    return applyDecorators(UseGuards(AuthGuard), ApiBasicAuth());
}
