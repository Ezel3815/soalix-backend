import { User } from "@prisma/client";

export function InjectUser(req: Request, user: User) {
    req["user"] = user;
}
