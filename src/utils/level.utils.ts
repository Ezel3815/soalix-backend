import { AnswerType } from "@prisma/client";

/**
 * The XP/Level curve — single source of truth on the backend so mobile
 * never has to duplicate this math (it just displays what the API
 * returns). Cumulative XP needed to REACH a given level:
 *   level 1 = 0, level 2 = 100, level 3 = 300, level 4 = 600, level 5 = 1000...
 * i.e. cumulativeXp(level) = 50 * (level - 1) * level
 * Tune this curve here only — nothing else needs to change.
 */
export function cumulativeXpForLevel(level: number): number {
    return 50 * (level - 1) * level;
}

export interface LevelInfo {
    level: number;
    xp: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
}

export function getLevelInfo(xp: number): LevelInfo {
    let level = 1;
    while (cumulativeXpForLevel(level + 1) <= xp) {
        level += 1;
    }
    const xpIntoLevel = xp - cumulativeXpForLevel(level);
    const xpForNextLevel =
        cumulativeXpForLevel(level + 1) - cumulativeXpForLevel(level);
    return { level, xp, xpIntoLevel, xpForNextLevel };
}

/**
 * XP awarded per card answer. Wrong answers (AGAIN) earn nothing —
 * XP should reward retention, not just activity. Only ever applied to
 * a card's first-time answer (see decks-cards.service.ts) so it can't
 * be farmed by re-reviewing the same card repeatedly.
 */
export function xpForAnswer(answer: AnswerType): number {
    switch (answer) {
        case "EASY":
            return 15;
        case "GOOD":
            return 10;
        case "HARD":
            return 5;
        case "AGAIN":
        case "NONE":
        default:
            return 0;
    }
}
