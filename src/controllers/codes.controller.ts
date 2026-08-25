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
import { ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { DAuth } from "src/decorators/auth.decorator";
import { DRole } from "src/decorators/role.decorator";
import { DUser } from "src/decorators/user.decorator";
import { CreateCodeDto } from "src/dtos/codes/create-code.dto";
import { CreateMultiCodeDto } from "src/dtos/codes/create-multi-code.dto";
import { LinkDecksByCodeDto } from "src/dtos/codes/link-decks-by-code.dto";
import { UpdateCodeDto } from "src/dtos/codes/update-code.dto";
import { FindQueryDto } from "src/dtos/find-query.dto";
import { CodesService } from "src/services/codes.service";
import { Response } from 'express';
import {  Res } from '@nestjs/common';

@ApiTags("Codes")
@Controller("codes")
export class CodesController {
    constructor(private service: CodesService) {}

    @DRole()
    @Post("")
    async create(@DUser() user: User, @Body() createCodeDto: CreateCodeDto) {
        return await this.service.create(createCodeDto);
    }

    @DRole()
    @Post("create-multi-code")
    async createMultiCode(@DUser() user: User, @Body() createMultiCodeDto: CreateMultiCodeDto) {
        return await this.service.createMultiCode(createMultiCodeDto);
    }

    @Get('export-csv')
    async exportCodesToCSV(@Res() res: Response) {
    const csv = await this.service.getCodesAsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=codes.csv');
    res.send(csv);
  }

    @DRole()
    @Get("")
    async read(@Query() findQueryDto: FindQueryDto) {
        return await this.service.read(findQueryDto);
    }

    @DRole()
    @Get(":id")
    async readOne(@Param("id", ParseIntPipe) id: number) {
        return await this.service.readOne(id);
    }

    @DRole()
    @Put(":id")
    async update(
        @DUser() user: User,
        @Param("id", ParseIntPipe) id: number,
        @Body() updateCodeDto: UpdateCodeDto,
    ) {
        return await this.service.update(id, updateCodeDto);
    }

    @DRole()
    @Delete(":id")
    async delete(@Param("id", ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }

    @DAuth()
    @Post("link-by-code")
    async linkDecksByCode(
        @DUser() user: User,
        @Body() linkDecksByCodeDto: LinkDecksByCodeDto,
    ) {
        return await this.service.linkDecksByCode(
            user,
            linkDecksByCodeDto.code,
        );
    }
}
