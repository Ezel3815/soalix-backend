import { UseGuards, applyDecorators } from "@nestjs/common";
import { RoleGuard } from "src/guards/role.guard";
import { DAuth } from "./auth.decorator";

export function DRole() {
    return applyDecorators(DAuth(), UseGuards(RoleGuard));
}
