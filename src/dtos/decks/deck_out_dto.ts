import {
    Card,
    CardAnswer,
    Deck,
    DeckType,
    User,
    UserRole,
} from "@prisma/client";
import { CardOutDto } from "../cards/card.out-dto";

type DeckWithMeta = Deck & {
    cards: (Card & { answers: CardAnswer[] })[];
    users?: { user_id: number }[];
    _count: {
        children: number;
    };
};

export function DeckOutDto(user: User, deck: DeckWithMeta) {
    const shared = deck.users?.some((u) => u.user_id === user.id) ?? false;

    const isLocked =
        user.role !== UserRole.ADMIN &&
        (
            (deck.public && !shared) ||
            (deck.type === DeckType.PACKAGE_DECK && deck._count.children === 0) ||
            (deck.type === DeckType.CARDS_DECK && (!Array.isArray(deck.cards) || deck.cards.length === 0))
        );

    return {
        ...deck,
        editable: user.role === UserRole.ADMIN,
        sharable: false,
      //  cards: deck.cards?.map((card) => CardOutDto(card)) ?? [],
        shared,
        locked: isLocked,
    };
}
