import { AnswerType } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { startOfUtcDay } from "./date.utils";
import { getLevelInfo } from "./level.utils";

/**
 * Quests (monthly / friends / daily) are computed from data that is already
 * tracked (CardAnswer.updated_at, ActivityEvent, Follow) — no new tables and
 * no migration. The only thing stored is "chest claimed", kept as a
 * `claim:<chest>:<period>` row in UserAchievement (unique per user, so a
 * chest can never be claimed twice), plus a `mastery:<cardId>:<day>` row
 * per card the first time it's mastered that day (see recordCardMasteryIfNew).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const MONTHLY_TARGET = 100;
export const MONTHLY_CHESTS = [
    { id: "monthly_1", at: 25, xp: 50 },
    { id: "monthly_2", at: 60, xp: 100 },
    { id: "monthly_3", at: 100, xp: 200 },
];

export const DAILY_QUESTS = [
    { id: "daily_reviews", target: 10, xp: 20, tier: "bronze" },
    { id: "daily_mastery", target: 5, xp: 30, tier: "silver" },
    { id: "daily_chapter", target: 1, xp: 50, tier: "gold" },
];

export const FRIENDS_TARGET = 50;
export const FRIENDS_XP = 100;
// BUG #3: without a personal floor, a partner who contributes 0 could still
// claim the chest off someone else's work. Require a minimum of your own.
export const FRIENDS_MIN_CONTRIBUTION = 10;

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);

function periodBounds(now: Date) {
    const today = startOfUtcDay(now);
    const tomorrow = new Date(today.getTime() + DAY_MS);

    const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    // Week = Monday..Sunday (UTC)
    const dow = (today.getUTCDay() + 6) % 7;
    const weekStart = new Date(today.getTime() - dow * DAY_MS);
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);

    return { today, tomorrow, monthStart, nextMonth, weekStart, weekEnd };
}

const hoursLeft = (end: Date, now: Date) =>
    Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 3600000));

/** Claim row id for a chest in the period it currently belongs to. */
function claimKey(chestId: string, now: Date) {
    const b = periodBounds(now);
    if (chestId.startsWith("monthly_"))
        return `claim:${chestId}:${monthKey(now)}`;
    if (chestId === "friends") return `claim:friends:${dayKey(b.weekStart)}`;
    return `claim:${chestId}:${dayKey(b.today)}`;
}

async function findPartnerId(prisma: PrismaService, userId: number) {
    const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
        orderBy: { created_at: "desc" },
    });
    const ids = following.map((f) => f.followingId);
    if (ids.length === 0) return null;

    const mutual = await prisma.follow.findMany({
        where: { followerId: { in: ids }, followingId: userId },
        select: { followerId: true },
    });
    const mutualSet = new Set(mutual.map((m) => m.followerId));
    return ids.find((id) => mutualSet.has(id)) ?? null;
}

/**
 * BUG #4 fix: called from DecksCardsService.answer() whenever a card ends up
 * EASY/GOOD. Writes a one-time-per-card-per-day row instead of relying on
 * the card's *current* answer, so re-answering a card worse later the same
 * day can no longer make mastery progress go down.
 */
export async function recordCardMasteryIfNew(
    prisma: PrismaService,
    userId: number,
    cardId: number,
): Promise<void> {
    const key = `mastery:${cardId}:${dayKey(startOfUtcDay(new Date()))}`;
    try {
        await prisma.userAchievement.create({
            data: { user_id: userId, achievement_id: key },
        });
    } catch (e: any) {
        // Unique constraint => already recorded today for this card, ignore.
        if (e?.code !== "P2002") throw e;
    }
}

export async function getQuestsForUser(prisma: PrismaService, userId: number) {
    const now = new Date();
    const b = periodBounds(now);

    const me = await prisma.user.findUnique({ where: { id: userId } });

    const claimRows = await prisma.userAchievement.findMany({
        where: { user_id: userId, achievement_id: { startsWith: "claim:" } },
        select: { achievement_id: true },
    });
    const claimed = new Set(claimRows.map((c) => c.achievement_id));
    const isClaimed = (chestId: string) => claimed.has(claimKey(chestId, now));

    const countSince = (user_id: number, since: Date, extra: object = {}) =>
        prisma.cardAnswer.count({
            where: { user_id, updated_at: { gte: since }, ...extra },
        });

    const [monthPoints, reviewsToday, masteryToday, chaptersToday, myWeek] =
        await Promise.all([
            countSince(userId, b.monthStart),
            countSince(userId, b.today),
            // BUG #4: count durable mastery records, not the card's live state.
            prisma.userAchievement.count({
                where: {
                    user_id: userId,
                    achievement_id: { startsWith: "mastery:" },
                    created_at: { gte: b.today },
                },
            }),
            prisma.activityEvent.count({
                where: {
                    user_id: userId,
                    type: "chapter_completed",
                    created_at: { gte: b.today },
                },
            }),
            countSince(userId, b.weekStart),
        ]);

    // Friends quest: paired with the most recent mutual friend.
    const partnerId = await findPartnerId(prisma, userId);
    let partner: any = null;
    let partnerWeek = 0;
    if (partnerId !== null) {
        const p = await prisma.user.findUnique({ where: { id: partnerId } });
        if (p) {
            partner = {
                id: p.id,
                name: p.name,
                username: p.username,
                avatar_hair: p.avatar_hair,
            };
            partnerWeek = await countSince(p.id, b.weekStart);
        }
    }
    const friendsTotal = myWeek + partnerWeek;

    return {
        monthly: {
            year: now.getUTCFullYear(),
            month: now.getUTCMonth() + 1,
            days_left: Math.max(
                1,
                Math.ceil((b.nextMonth.getTime() - now.getTime()) / DAY_MS),
            ),
            points: Math.min(monthPoints, MONTHLY_TARGET),
            target: MONTHLY_TARGET,
            chests: MONTHLY_CHESTS.map((c) => ({
                id: c.id,
                at: c.at,
                xp: c.xp,
                reached: monthPoints >= c.at,
                claimed: isClaimed(c.id),
            })),
        },
        friends: {
            hours_left: hoursLeft(b.weekEnd, now),
            target: FRIENDS_TARGET,
            my_count: myWeek,
            partner_count: partnerWeek,
            me: { id: me.id, name: me.name, avatar_hair: me.avatar_hair },
            partner,
            chest: {
                id: "friends",
                xp: FRIENDS_XP,
                // BUG #3: require your own minimum contribution, not just the combined total.
                reached:
                    partner !== null &&
                    friendsTotal >= FRIENDS_TARGET &&
                    myWeek >= FRIENDS_MIN_CONTRIBUTION,
                claimed: isClaimed("friends"),
            },
        },
        daily: {
            hours_left: hoursLeft(b.tomorrow, now),
            quests: DAILY_QUESTS.map((q) => {
                const value =
                    q.id === "daily_reviews"
                        ? reviewsToday
                        : q.id === "daily_mastery"
                          ? masteryToday
                          : chaptersToday;
                return {
                    id: q.id,
                    tier: q.tier,
                    xp: q.xp,
                    target: q.target,
                    progress: Math.min(value, q.target),
                    completed: value >= q.target,
                    claimed: isClaimed(q.id),
                };
            }),
        },
    };
}

/** Opens a chest: verifies it's earned and unclaimed, then grants its XP. */
export async function claimQuestChest(
    prisma: PrismaService,
    userId: number,
    chestId: string,
): Promise<{ ok: boolean; message?: string; xp?: number; leveledUp?: boolean; newLevel?: number }> {
    const quests = await getQuestsForUser(prisma, userId);
    const chest =
        quests.monthly.chests.find((c) => c.id === chestId) ??
        (quests.friends.chest.id === chestId ? quests.friends.chest : null) ??
        quests.daily.quests
            .filter((q) => q.id === chestId)
            .map((q) => ({
                id: q.id,
                xp: q.xp,
                reached: q.completed,
                claimed: q.claimed,
            }))[0];

    if (!chest) return { ok: false, message: "Unknown chest" };
    if (!chest.reached) return { ok: false, message: "Chest is not ready yet" };
    if (chest.claimed) return { ok: false, message: "Chest already opened" };

    let leveledUp = false;
    let newLevel: number | undefined;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.userAchievement.create({
                data: {
                    user_id: userId,
                    achievement_id: claimKey(chestId, new Date()),
                },
            });

            const before = await tx.user.findUnique({ where: { id: userId } });
            const levelBefore = getLevelInfo(before.xp).level;

            const after = await tx.user.update({
                where: { id: userId },
                data: { xp: { increment: chest.xp } },
            });
            const levelAfter = getLevelInfo(after.xp).level;

            // BUG #7: claiming a chest could cross a level boundary with no
            // level-up event, unlike answering a card.
            if (levelAfter > levelBefore) {
                leveledUp = true;
                newLevel = levelAfter;
                await tx.activityEvent.create({
                    data: {
                        user_id: userId,
                        type: "level_up",
                        title: `Reached Level ${levelAfter}`,
                    },
                });
            }
        });
    } catch (e: any) {
        // Unique key hit => already claimed in a parallel request.
        if (e?.code === "P2002")
            return { ok: false, message: "Chest already opened" };
        throw e;
    }
    return { ok: true, xp: chest.xp, leveledUp, newLevel };
}
