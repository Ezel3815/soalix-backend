import {
    Card,
    CardAnswer,
    Deck,
    DeckType,
    User,
    UserRole,
} from "@prisma/client";
import { CardOutDto } from "../cards/card.out-dto";

export type DeckReqursive = Deck & {
    cards: (Card & { answers: CardAnswer[] })[];
    children?: DeckReqursive[];
    users?: { user_id }[]; // <-- Correct this
};

function countAnswers(cards: (Card & { answers: CardAnswer[] })[]) {
    let easyGood = 0;
    let again = 0;
    let hard = 0;

    for (const card of cards) {
        const answer = card.answers?.[0]?.answer;
        if (answer === "EASY" || answer === "GOOD") easyGood++;
        else if (answer === "AGAIN") again++;
        else if (answer === "HARD") hard++;
    }

    return { easyGoodCount: easyGood, againCount: again, hardCount: hard };
}
export function DeckRecursiveOutDto(user: User, deck: DeckReqursive) {
        const { cards, ...deckWithoutCards } = deck;

    var  shared= deck.users.some(u => u.user_id === user.id);
    var isLocked =user.role != UserRole.ADMIN && 
    ((deck.public && shared ===false) ||( // public attribute consider as a locked 
        (deck.type == DeckType.PACKAGE_DECK &&deck.children.length == 0) ||
        (deck.type == DeckType.CARDS_DECK && deck.cards.length == 0)
    ));

    
    const answerCounts = countAnswers(deck.cards);

    return {
        ...deckWithoutCards,
        editable: user.role == UserRole.ADMIN,
         sharable: false,
        
      //  cards: deck?.cards?.map((card) => CardOutDto(card)),
        easyGoodCount: answerCounts.easyGoodCount,
        againCount: answerCounts.againCount,
        hardCount: answerCounts.hardCount,
        children:isLocked===true ?[]: deck?.children?.map((child) =>
            DeckRecursiveOutDto(user, child),
        ),

       shared: deck.users.some(u => u.user_id === user.id),
        locked:isLocked,
    };
}
