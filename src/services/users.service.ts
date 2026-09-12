import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma, User, UserRole, UserStatus } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { JwtConstant } from "src/constants/jwt.constant";
import { LoginDto } from "src/dtos/auth/login.dto";
import { RegisterDto } from "src/dtos/auth/register.dto";
import { FindQueryDto } from "src/dtos/find-query.dto";
import { CreateUserDto } from "src/dtos/users/create-user.dto";
import { UpdateMeDto } from "src/dtos/users/update-me.dto";
import { UpdatePasswordDto } from "src/dtos/users/update-password.dto";
import { UpdateUserDto } from "src/dtos/users/update-user.dto";
import { UpdateProfileDto } from "src/dtos/users/update-profile.dto";
import { UserOutDto, UserProfileOutDto } from "src/dtos/users/user.out-dto";
import { getLevelInfo } from "src/utils/level.utils";
import { GenerateBadRequestException } from "src/exception/bad-request.exception";
import { GenerateUnauthorizedException } from "src/exception/unauthorized.exception";
import { v7 as uuid } from "uuid";
import * as md5 from "md5";

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) {}

    async create(createUserDto: CreateUserDto) {
        const user = await this.prismaService.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password: md5(createUserDto.password),
                status: UserStatus.ACTIVE,
                role: createUserDto.role,
            },
        });
        return UserOutDto(user);
    }

    async searchUsers(query: string, excludeUserId: number) {
        if (!query || query.trim().length === 0) return [];

        const users = await this.prismaService.user.findMany({
            where: {
                id: { not: excludeUserId },
                OR: [
                    { username: { contains: query } },
                    { name: { contains: query } },
                ],
            },
            take: 20,
        });

        return users.map(UserOutDto);
    }

    /// Ranks the requesting user together with everyone they follow, by
    /// total XP — the "friends leaderboard" for V2. Deliberately scoped
    /// to follows only (not a global leaderboard) per product decision.
    async getFriendsLeaderboard(userId: number) {
        const follows = await this.prismaService.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        const ids = [userId, ...follows.map((f) => f.followingId)];

        const users = await this.prismaService.user.findMany({
            where: { id: { in: ids } },
        });

        const ranked = users
            .map((u) => ({
                id: u.id,
                name: u.name,
                username: u.username,
                avatar_hair: u.avatar_hair,
                xp: u.xp,
                level: getLevelInfo(u.xp).level,
                isMe: u.id === userId,
            }))
            .sort((a, b) => b.xp - a.xp);

        return ranked;
    }
    

    async read(findQueryDto: FindQueryDto) {
        const users = await this.prismaService.user.findMany({
            skip: findQueryDto.skip,
            take: findQueryDto.limit,
            where: findQueryDto.filter ?? {},
            orderBy: findQueryDto.sort ?? { created_at: "desc" },
            include: { _count: true },
        });
        const count = await this.prismaService.user.count({
            where: findQueryDto.filter ?? {},
        });
        return {
            count: count,
            data: users.map(UserOutDto),
        };
    }

    async readOne(id: number) {
        const user = await this.prismaService.user.findUnique({
            where: { id },
        });
        return UserOutDto(user);
    }

    async getProfile(targetUserId: number, requestingUserId: number) {
        const user = await this.prismaService.user.findUnique({
            where: { id: targetUserId },
        });
        if (!user) GenerateBadRequestException(["User does not exist"]);

        const followersCount = await this.prismaService.follow.count({
            where: { followingId: targetUserId },
        });
        const followingCount = await this.prismaService.follow.count({
            where: { followerId: targetUserId },
        });

        const followingRecord = await this.prismaService.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: requestingUserId,
                    followingId: targetUserId,
                },
            },
        });
        const isFollowing = !!followingRecord;

        let isFriend = false;
        if (isFollowing) {
            const reverseRecord = await this.prismaService.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: targetUserId,
                        followingId: requestingUserId,
                    },
                },
            });
            isFriend = !!reverseRecord;
        }

        return UserProfileOutDto(
            user,
            followersCount,
            followingCount,
            isFollowing,
            isFriend,
        );
    }

    async follow(followerId: number, followingId: number) {
        if (followerId === followingId) {
            GenerateBadRequestException(["You can't follow yourself"]);
        }

        const targetUser = await this.prismaService.user.findUnique({
            where: { id: followingId },
        });
        if (!targetUser) GenerateBadRequestException(["User does not exist"]);

        const existing = await this.prismaService.follow.findUnique({
            where: {
                followerId_followingId: { followerId, followingId },
            },
        });
        if (existing) GenerateBadRequestException(["Already following this user"]);

        await this.prismaService.follow.create({
            data: { followerId, followingId },
        });

        return true;
    }

    async unfollow(followerId: number, followingId: number) {
        await this.prismaService.follow.deleteMany({
            where: { followerId, followingId },
        });
        return true;
    }

    async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
        if (updateProfileDto.username) {
            const existing = await this.prismaService.user.findUnique({
                where: { username: updateProfileDto.username },
            });
            if (existing && existing.id !== userId) {
                GenerateBadRequestException(["Username already taken"]);
            }
        }

        const user = await this.prismaService.user.update({
            where: { id: userId },
            data: {
                username: updateProfileDto.username,
                avatar_hair: updateProfileDto.avatar_hair,
                avatar_hair_color: updateProfileDto.avatar_hair_color,
                avatar_skin_color: updateProfileDto.avatar_skin_color,
                avatar_clothing_color: updateProfileDto.avatar_clothing_color,
                avatar_glasses: updateProfileDto.avatar_glasses,
            },
        });

        return UserOutDto(user);
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.prismaService.user.update({
            where: {
                id,
            },
            data: {
                name: updateUserDto.name,
                status: updateUserDto.status,
            },
        });
        if (!user) GenerateBadRequestException(["User does not exist"]);
        return UserOutDto(user);
    }

    async updateMe(userId: number, updateMeDto: UpdateMeDto) {
        const user = await this.prismaService.user.update({
            where: {
                id: userId,
            },
            data: {
                name: updateMeDto.name,
            },
        });
        return UserOutDto(user);
    }

    async updateMyPassword(
        userId: number,
        updatePasswordDto: UpdatePasswordDto,
    ) {
        const user = await this.prismaService.user.findFirst({
            where: {
                id: userId,
                password: md5(updatePasswordDto.old_password),
            },
        });
        if (!user) GenerateBadRequestException(["Wrong password"]);
        return UserOutDto(
            await this.prismaService.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    password: md5(updatePasswordDto.new_password),
                },
            }),
        );
    }

    //TODO: delete all owned decks.
    async delete(id: number) {
        const user = await this.prismaService.user.delete({ where: { id } });
        if (!user) GenerateBadRequestException(["User does not exist"]);
        return true;
    }
}
