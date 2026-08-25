import * as fs from "fs";
import { join } from "path";
import { v7 as uuid } from "uuid";

export function GetFileUrl(name: string) {
    return `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/public/${name}`;
}

export function GetFilePath(name: string) {
    return join(__dirname, "..", "..", "..", "public", name);
}

export function GetRandomNameForFile(file: Express.Multer.File) {
    const ext =
        file.originalname.split(".")[file.originalname.split(".").length - 1];
    return `${uuid()}.${ext}`;
}

export function CheckFileExistance(path: string) {
    return fs.existsSync(path);
}

export function SaveFile(name: string, buffer: Buffer) {
    fs.writeFileSync(GetFilePath(name), buffer);
}

export function DeleteFile(name: string) {
    if (CheckFileExistance(GetFilePath(name))) fs.unlinkSync(GetFilePath(name));
}
