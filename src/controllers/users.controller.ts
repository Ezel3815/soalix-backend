import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { DAuth } from "src/decorators/auth.decorator";
import { DRole } from "src/decorators/role.decorator";
import { DUser } from "src/decorators/user.decorator";
import { LoginDto } from "src/dtos/auth/login.dto";
import { RegisterDto } from "src/dtos/auth/register.dto";
import { CreateUserDto } from "src/dtos/users/create-user.dto";
import { UpdateMeDto } from "src/dtos/users/update-me.dto";
import { UpdatePasswordDto } from "src/dtos/users/update-password.dto";
import { UpdateUserDto } from "src/dtos/users/update-user.dto";
import { AuthService } from "src/services/auth.service";
import { UsersService } from "src/services/users.service";
import { ApiTags } from "@nestjs/swagger";
import { FindQueryDto } from "src/dtos/find-query.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(private service: UsersService) {}

    @DRole()
    @Post("")
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.service.create(createUserDto);
    }

    @DRole()
    @Get("")
    async read(@Query() findQueryDto: FindQueryDto) {
        return await this.service.read(findQueryDto);
    }

    @DAuth()
    @Get("me")
    async readMe(@DUser() user: User) {
        return await this.service.readOne(user.id);
    }

    @DRole()
    @Get(":id")
    async readOne(@Param("id", ParseIntPipe) id: number) {
        return await this.service.readOne(id);
    }

    @DAuth()
    @Put("me")
    async updateMe(@DUser() user: User, @Body() updateMeDto: UpdateMeDto) {
        return await this.service.updateMe(user.id, updateMeDto);
    }

    @DRole()
    @Put(":id")
    async update(
        @Param("id", ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return await this.service.update(id, updateUserDto);
    }

    @DAuth()
    @Put("me/password")
    async updateMyPassword(
        @DUser() user: User,
        @Body() updatePasswordDto: UpdatePasswordDto,
    ) {
        return await this.service.updateMyPassword(user.id, updatePasswordDto);
    }

    @DAuth()
    @Delete("me")
    async deleteMe(@DUser() user: User) {
        return await this.service.delete(user.id);
    }

    @DRole()
    @Delete(":id")
    async delete(@Param("id", ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }
}
