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
import { xpForAnswer, getLevelInfo } from "src/utils/level.utils";
import { isSameUtcDay, isYesterday, startOfUtcDay } from "src/utils/date.utils";
import { checkAndUnlockAchievements } from "src/utils/achievement.utils";

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
        const existing = await this.prismaService.cardAnswer.findUnique({
            where: { user_id_card_id: { user_id: user.id, card_id: cardId } },
        });

        await this.prismaService.cardAnswer.upsert({
            where: { user_id_card_id: { user_id: user.id, card_id: cardId } },
            create: {
                user_id: user.id,
                card_id: cardId,
                answer: answerCardDto.answer,
            },
            update: { answer: answerCardDto.answer, updated_at: new Date() },
        });

        const levelBefore = getLevelInfo(
            (await this.prismaService.user.findUnique({ where: { id: user.id } })).xp,
        ).level;

        // XP only on a genuinely new answer — re-reviewing a card you've
        // already answered shouldn't let XP be farmed repeatedly.
        if (!existing) {
            const xpGained = xpForAnswer(answerCardDto.answer);
            if (xpGained > 0) {
                await this.prismaService.user.update({
                    where: { id: user.id },
                    data: { xp: { increment: xpGained } },
                });
            }
        }

        const userAfterXp = await this.prismaService.user.findUnique({
            where: { id: user.id },
        });
        const levelAfter = getLevelInfo(userAfterXp.xp).level;
        const leveledUp = levelAfter > levelBefore;

        if (leveledUp) {
            await this.prismaService.activityEvent.create({
                data: {
                    user_id: user.id,
                    type: "level_up",
                    title: `Reached Level ${levelAfter}`,
                },
            });
        }

        const streakResult = await this.updateStreak(user.id);

        // Chapter-completion check — only worth checking when this
        // answer was for a card that had never been answered before,
        // since that's the only way a deck can newly become 100%.
        let chapterCompleted = false;
        let chapterTitle: string | null = null;
        if (!existing) {
            const card = await this.prismaService.card.findUnique({
                where: { id: cardId },
                include: { deck: true },
            });
            if (card) {
                const totalCards = await this.prismaService.card.count({
                    where: { deck_id: card.deck_id },
                });
                const answeredCards = await this.prismaService.cardAnswer.count({
                    where: {
                        user_id: user.id,
                        card: { deck_id: card.deck_id },
                    },
                });
                if (totalCards > 0 && answeredCards === totalCards) {
                    chapterCompleted = true;
                    chapterTitle = card.deck.title;
                    await this.prismaService.activityEvent.create({
                        data: {
                            user_id: user.id,
                            type: "chapter_completed",
                            title: chapterTitle,
                        },
                    });
                }
            }
        }

        const newAchievements = await checkAndUnlockAchievements(
            this.prismaService,
            user.id,
        );

        return {
            leveledUp,
            newLevel: leveledUp ? levelAfter : undefined,
            streakSaved: streakResult.saved,
            newStreak: streakResult.saved ? streakResult.newStreak : undefined,
            chapterCompleted,
            chapterTitle: chapterCompleted ? chapterTitle : undefined,
            newAchievements,
        };
    }

    /// Studying at all today (any review, first-time or repeat) counts
    /// toward the streak. Consecutive calendar days increment it,
    /// missing a day resets it to 1, multiple reviews the same day are
    /// a no-op (streak already counted for today). Returns whether this
    /// call was the one that "saved" today's streak, so the caller can
    /// show a one-time celebration rather than on every card.
    private async updateStreak(
        userId: number,
    ): Promise<{ saved: boolean; newStreak: number }> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
        });
        const today = startOfUtcDay(new Date());

        if (user.last_study_date && isSameUtcDay(user.last_study_date, today)) {
            return { saved: false, newStreak: user.current_streak };
        }

        const newStreak =
            user.last_study_date && isYesterday(user.last_study_date, today)
                ? user.current_streak + 1
                : 1;

        await this.prismaService.user.update({
            where: { id: userId },
            data: { current_streak: newStreak, last_study_date: today },
        });

        return { saved: true, newStreak };
    }

    async bulkAnswer(user:User,  bulkUpdateAnswersDto: BulkUpdateAnswersDto) {
        for(let answer of bulkUpdateAnswersDto.answers) {
            await this.answer(user, answer.card_id, {answer: answer.answer})
        }
    }

}
