import { Transform } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class FindQueryDto {
    @IsOptional()
    @Transform(({ value }) => {
        return Number.parseInt(value);
    })
    page: number = 0;

    @IsOptional()
    @Transform(({ value, obj }) => {
        if (obj.page) return obj.limit * obj.page;
        return Number.parseInt(value);
    })
    @IsInt()
    skip: number = 0;

    @IsOptional()
    @Transform(({ value }) => Number.parseInt(value))
    @IsInt()
    limit: number = 10;

    @IsOptional()
    filter: any;

    @IsOptional()
    sort: any;
}
