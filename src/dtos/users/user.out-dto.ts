import { User } from "@prisma/client";

export function UserOutDto(user: User) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        username: user.username,
        avatar_hair: user.avatar_hair,
        avatar_hair_color: user.avatar_hair_color,
        avatar_skin_color: user.avatar_skin_color,
        avatar_clothing_color: user.avatar_clothing_color,
        avatar_glasses: user.avatar_glasses,
        current_streak: user.current_streak,
        created_at: user.created_at,
    };
}

export function UserProfileOutDto(
    user: User,
    followersCount: number,
    followingCount: number,
    isFollowing: boolean,
    isFriend: boolean,
) {
    return {
        ...UserOutDto(user),
        followersCount,
        followingCount,
        isFollowing,
        isFriend,
    };
}
