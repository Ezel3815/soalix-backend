import { Card, CardAnswer, Deck, UserDeck } from "@prisma/client";
import { CardOutDto } from "../cards/card.out-dto";
import { ShareDeckDto } from "./share-deck.dto";

export function UserDeckOutDto(
    userDeck: UserDeck & {
        deck: Deck & { cards: (Card & { answers: CardAnswer[] })[] };
    },
) {
    return {
        ...userDeck.deck,
        editable: userDeck.editable,
        sharable: userDeck.sharable,
        created_at: userDeck.created_at,
        cards: userDeck.deck.cards.map((card) => CardOutDto(card)),
        children: [],
        locked: false,
    };
}
