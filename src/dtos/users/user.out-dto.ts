import { User } from "@prisma/client";
import { userInfo } from "os";

export function UserOutDto(user: User) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
    };
}
