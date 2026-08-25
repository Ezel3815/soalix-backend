import { DeckType, User } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { CardOutDto } from "src/dtos/cards/card.out-dto";
import { ChangeCardsOrderDto } from "src/dtos/cards/change-cards-order.dto";
import { CreateCardDto } from "src/dtos/cards/create-card.dto";
import { UpdateCardDto } from "src/dtos/cards/update-card.dto";
import { FindQueryDto } from "src/dtos/find-query.dto";
import { DecksService } from "./decks.service";
import { GenerateBadRequestException } from "src/exception/bad-request.exception";
import { MediaService } from "./media.service";
import { BadRequestException, Inject, Injectable, forwardRef } from "@nestjs/common";
import { AnswerCardDto } from "src/dtos/cards/answer-card.dto";
import { BulkUpdateAnswersDto } from "src/dtos/cards/bulk-update-answers.dto";
import { log } from "console";

@Injectable()
export class DecksCardsService {
    constructor(
        private prismaService: PrismaService,
        @Inject(forwardRef(() => DecksService))
        private decksService: DecksService,
        private mediaService: MediaService,
    ) {}

    async create(user: User, deckId: number, createCardDto: CreateCardDto) {
        // if (
        //     !(await this.decksService.checkOwnership(
        //         user,
        //         deckId,
        //         {
        //             editable: true,
        //         },
        //         { type: DeckType.CARDS_DECK },
        //     ))
        // )
        //     GenerateBadRequestException([
        //         "You can't edit a deck that you don't own",
        //     ]);

        const lastDeckCard = await this.prismaService.card.findFirst({
            where: {
                deck_id: deckId,
            },
            orderBy: { order: "desc" },
        });

        const card = await this.prismaService.card.create({
            data: {
                deck_id: deckId,
                type: createCardDto.type,
                document_name: createCardDto.document_name,
                document_title: createCardDto.document_title,
                back_image_name: createCardDto.back_image_name,
                front_image_name: createCardDto.front_image_name,
                data: JSON.stringify(createCardDto.data),
                order: lastDeckCard ? lastDeckCard.order + 1 : 1,
            },
            include: {
                answers: true,
            },
        });

        return CardOutDto(card);
    }

    async changeCardsOrder(
        user: User,
        deckId: number,
        changeCardsOrderDto: ChangeCardsOrderDto,
    ) {
        if (
            !(await this.decksService.checkOwnership(
                user,
                deckId,
                {
                    editable: true,
                },
                { type: DeckType.CARDS_DECK },
            ))
        )
            GenerateBadRequestException([
                "You can't edit a deck that you don't own",
            ]);

        await this.prismaService.$transaction(
            changeCardsOrderDto.cards_ids.map((id, index) =>
                this.prismaService.card.update({
                    where: { id, deck_id: deckId },
                    data: { order: index },
                }),
            ),
        );

        return true;
    }

    async read(user: User, deckId: number) {
        if (
            !(await this.decksService.checkOwnership(
                user,
                deckId,
                {},
                { type: DeckType.CARDS_DECK },
            ))
        )
            GenerateBadRequestException([
                "You can't edit a deck that you don't own",
            ]);

        const cards = await this.prismaService.card.findMany({
            where: { deck_id: deckId },
            include: { answers: {where: {user_id: user.id}} },
        });

        return cards.map(CardOutDto);
    }

    async update(
        user: User,
        deckId: number,
        id: number,
        updateCardDto: UpdateCardDto,
    ) {
        // if (
        //     !(await this.decksService.checkOwnership(
        //         user,
        //         deckId,
        //         {
        //             editable: true,
        //         },
        //         { type: DeckType.CARDS_DECK },
        //     ))
        // )
        //     GenerateBadRequestException([
        //         "You can't edit a deck that you don't own",
        //     ]);


       

    
        const card = await this.prismaService.card.update({
            where: {
                id,
                deck_id: deckId,
            },
            data: {
                type: updateCardDto.type,
                document_name: updateCardDto.document_name,
                document_title: updateCardDto.document_title,
                back_image_name: updateCardDto.back_image_name,
                front_image_name: updateCardDto.front_image_name,
                data: JSON.stringify(updateCardDto.data),
            },
        });

        return card;
    }

    async delete(user: User | undefined, deckId: number, id: number) {
        if (
            user != undefined &&
            !(await this.decksService.checkOwnership(
                user,
                deckId,
                {
                    editable: true,
                },
                { type: DeckType.CARDS_DECK },
            ))
        )
            GenerateBadRequestException([
                "You can't edit a deck that you don't own",
            ]);

        await this.mediaService.deleteForCard(id);

        await this.prismaService.$transaction([
            this.prismaService.cardAnswer.deleteMany({
                where: {
                    card_id: id,
                },
            }),
            this.prismaService.media.deleteMany({
                where: {
                    OR: [
                        {
                            back_card: {
                                id,
                            },
                        },
                        {
                            front_card: {
                                id,
                            },
                        },
                        {
                            document_card: {
                                id,
                            },
                        },
                    ],
                },
            }),
            this.prismaService.card.delete({
                where: {
                    id,
                    deck_id: deckId,
                },
            }),
        ]);
    }

    async answer(user: User, cardId: number, answerCardDto: AnswerCardDto) {
        await this.prismaService.cardAnswer.upsert({
            where: { user_id_card_id: { user_id: user.id, card_id: cardId } },
            create: {
                user_id: user.id,
                card_id: cardId,
                answer: answerCardDto.answer,
            },
            update: { answer: answerCardDto.answer, updated_at: new Date() },
        });
    }

    async bulkAnswer(user:User,  bulkUpdateAnswersDto: BulkUpdateAnswersDto) {
        for(let answer of bulkUpdateAnswersDto.answers) {
            await this.answer(user, answer.card_id, {answer: answer.answer})
        }
    }

}
