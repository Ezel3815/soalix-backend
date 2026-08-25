import { v4 as uuid } from "uuid";

export function generateRandomCode(length: number) {
    const fullCode = uuid().replace(/-/g, "");
    return fullCode.slice(0, length).toLowerCase();
}
