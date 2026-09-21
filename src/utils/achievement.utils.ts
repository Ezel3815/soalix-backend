import { PrismaService } from "nestjs-prisma";
import { getLevelInfo } from "./level.utils";
import { runInBackground, sendPushToFollowers } from "./push.utils";

export interface AchievementDef {
    id: string;
    title: string;
    description: string;
}

/// Fixed V1 achievement set — every condition here is checked against
/// data that's already real and tracked (no fake/placeholder progress).
/// Once unlocked, an achievement is permanent (stored in
/// UserAchievement), so e.g. a later streak reset never takes back an
/// already-earned "7-Day Streak" badge.
export const ACHIEVEMENTS: AchievementDef[] = [
    { id: "first_review", title: "First Review", description: "Answer your first flashcard" },
    { id: "cards_100", title: "Century Club", description: "Answer 100 cards" },
    { id: "cards_1000", title: "1,000 Cards", description: "Answer 1,000 cards" },
    { id: "streak_7", title: "7-Day Streak", description: "Study 7 days in a row" },
    { id: "streak_30", title: "30-Day Streak", description: "Study 30 days in a row" },
    { id: "level_5", title: "Level 5", description: "Reach level 5" },
    { id: "level_10", title: "Level 10", description: "Reach level 10" },
    { id: "first_friend", title: "First Friend", description: "Make your first mutual friend" },
];

/// Call after anything that could move the needle (answering a card is
/// the only trigger point for now). Cheap enough to run every time —
/// it's a handful of counts plus an insert only when something's newly
/// earned.
export async function checkAndUnlockAchievements(
    prisma: PrismaService,
    userId: number,
) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const cardsAnswered = await prisma.cardAnswer.count({
        where: { user_id: userId },
    });
    const level = getLevelInfo(user.xp).level;

    const followingIds = (
        await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        })
    ).map((f) => f.followingId);

    let hasFriend = false;
    if (followingIds.length > 0) {
        const mutualCount = await prisma.follow.count({
            where: { followerId: { in: followingIds }, followingId: userId },
        });
        hasFriend = mutualCount > 0;
    }

    const shouldUnlock: Record<string, boolean> = {
        first_review: cardsAnswered >= 1,
        cards_100: cardsAnswered >= 100,
        cards_1000: cardsAnswered >= 1000,
        streak_7: user.current_streak >= 7,
        streak_30: user.current_streak >= 30,
        level_5: level >= 5,
        level_10: level >= 10,
        first_friend: hasFriend,
    };

    const alreadyUnlocked = await prisma.userAchievement.findMany({
        where: { user_id: userId },
        select: { achievement_id: true },
    });
    const alreadyIds = new Set(alreadyUnlocked.map((a) => a.achievement_id));

    const toUnlock = Object.entries(shouldUnlock)
        .filter(([id, met]) => met && !alreadyIds.has(id))
        .map(([id]) => id);

    // Unlock exactly once even when several requests run this check at the
    // same time (answering cards quickly): the (user, achievement) primary
    // key lets only ONE insert win; the others get P2002 and must not create
    // a feed event or send a push. Only what we really inserted counts.
    const unlocked: string[] = [];
    for (const achievement_id of toUnlock) {
        try {
            await prisma.userAchievement.create({
                data: { user_id: userId, achievement_id },
            });
            unlocked.push(achievement_id);
        } catch (e: any) {
            if (e?.code !== "P2002") throw e;
        }
    }

    if (unlocked.length > 0) {

        // Feed friends' achievement unlocks into the activity feed —
        // reuses this exact moment rather than a separate tracking path.
        const titleById = new Map(ACHIEVEMENTS.map((a) => [a.id, a.title]));
        await prisma.activityEvent.createMany({
            data: unlocked.map((id) => ({
                user_id: userId,
                type: "achievement_unlocked",
                title: titleById.get(id) ?? id,
            })),
        });

        // Push it to followers too, outside the app — one push per
        // unlock batch (not per achievement) so someone who unlocks
        // three at once doesn't get spammed.
        const firstTitle = titleById.get(unlocked[0]) ?? unlocked[0];
        const extra = unlocked.length - 1;
        runInBackground(() =>
            sendPushToFollowers(
                prisma,
                userId,
                "إنجاز جديد",
                extra > 0
                    ? `${user.name} فتح إنجاز "${firstTitle}" و${extra} إنجازات أخرى`
                    : `${user.name} فتح إنجاز "${firstTitle}"`,
                { type: "achievement_unlocked", userId: String(userId) },
            ),
        );
    }

    return unlocked;
}

export async function getAchievementsForUser(
    prisma: PrismaService,
    userId: number,
) {
    const unlocked = await prisma.userAchievement.findMany({
        where: { user_id: userId },
    });
    const unlockedMap = new Map(
        unlocked.map((u) => [u.achievement_id, u.unlocked_at]),
    );

    return ACHIEVEMENTS.map((def) => ({
        ...def,
        unlocked: unlockedMap.has(def.id),
        unlocked_at: unlockedMap.get(def.id) ?? null,
    }));
}
