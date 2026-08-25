import { Card, CardAnswer, Deck, Media, User } from "@prisma/client";
import { CardOutDto } from "../cards/card.out-dto";
import { GetFileUrl } from "src/utils/files.utils";

export function DocumentOutDto(document: Media & { document_card: Card }) {
    return {
        name: GetFileUrl(document.name),
        title: document.document_card.document_title,
    };
}
