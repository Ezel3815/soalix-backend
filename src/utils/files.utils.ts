import { v7 as uuid } from "uuid";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function GetFileUrl(name: string) {
    if (name.startsWith("http://") || name.startsWith("https://")) {
        return name;
    }
    return `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/public/${name}`;
}

export function GetRandomNameForFile(file: Express.Multer.File) {
    const ext =
        file.originalname.split(".")[file.originalname.split(".").length - 1];
    return `${uuid()}.${ext}`;
}

export async function SaveFile(name: string, buffer: Buffer): Promise<string> {
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    public_id: name,
                    resource_type: isPdf ? "raw" : "image",
                    folder: "soalix",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                },
            )
            .end(buffer);
    });
    return result.secure_url;
}

export async function DeleteFile(name: string) {
    if (!name.startsWith("http")) return;
    const isPdf = name.toLowerCase().includes(".pdf");
    const matches = name.match(/soalix\/([^./]+)/);
    if (matches) {
        await cloudinary.uploader.destroy(`soalix/${matches[1]}`, {
            resource_type: isPdf ? "raw" : "image",
        });
    }
}
