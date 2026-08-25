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
import { UserOutDto } from "src/dtos/users/user.out-dto";
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
