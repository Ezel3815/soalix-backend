import { Injectable } from "@nestjs/common";
import { MediaType, User } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { DocumentOutDto } from "src/dtos/decks/document.out-dto";
import {
    DeleteFile,
    GetRandomNameForFile,
    SaveFile,
} from "src/utils/files.utils";

@Injectable()
export class MediaService {
    constructor(private prismaService: PrismaService) {}

    async create(file: Express.Multer.File, type: MediaType) {
        const name = GetRandomNameForFile(file);
        SaveFile(name, file.buffer);
        return await this.prismaService.media.create({ data: { name, type } });
    }

    async delete(name) {
        DeleteFile(name);
        return await this.prismaService.media.delete({ where: { name } });
    }

    async deleteAllUnlinked() {
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 1);
        const media = await this.prismaService.media.findMany({
            where: {
                created_at: { lte: expiredDate },
                back_card: null,
                front_card: null,
                document_card: null,
            },
        });

        media.forEach((m) => {
            DeleteFile(m.name);
        });

        await this.prismaService.media.deleteMany({
            where: { name: { in: media.map((m) => m.name) } },
        });
    }

    async deleteForCard(cardId: number) {
        const card = await this.prismaService.card.findUnique({
            where: { id: cardId },
        });

        if (card.back_image_name) await this.delete(card.back_image_name);
        if (card.front_image_name) await this.delete(card.front_image_name);
        if (card.document_name) await this.delete(card.document_name);
    }

    async readDocuments(user: User) {
        const documents = await this.prismaService.media.findMany({
            where: {
                type: MediaType.PDF,
                document_card: {
                    deck: {
                        OR: [
                            {
                                users: {
                                    some: {
                                        user_id: user.id,
                                    },
                                },
                            },
                            {
                                public: true,
                            },
                        ],
                    },
                },
            },
            include: {
                document_card: true,
            },
        });

        return documents.map((deck) => DocumentOutDto(deck));
    }
}
