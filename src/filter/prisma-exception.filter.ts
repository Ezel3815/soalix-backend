// ─────────────────────────────────────────────────────────────────────
// NEW FILE → src/filters/prisma-exception.filter.ts
//
// Turns raw Prisma errors into proper HTTP codes instead of bare 500s.
// Register it in main.ts (see bottom of this file).
// ─────────────────────────────────────────────────────────────────────

import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PrismaExceptionFilter.name);

    catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse<Response>();

        // Always log — the meta field names the exact table/constraint,
        // which is what you need when a new relation starts blocking a delete.
        this.logger.error(`Prisma ${e.code}: ${e.message}`, JSON.stringify(e.meta));

        switch (e.code) {
            case "P2025": // record not found
                return res.status(404).json({
                    status: 404,
                    message: "Not found",
                    details: ["The requested record does not exist"],
                });

            case "P2003": // foreign key constraint failed
                return res.status(409).json({
                    status: 409,
                    message: "Conflict",
                    details: ["This record is still referenced by other data"],
                });

            case "P2002": // unique constraint failed
                return res.status(409).json({
                    status: 409,
                    message: "Conflict",
                    details: [
                        `Already exists: ${
                            (e.meta?.target as string[])?.join(", ") ?? "duplicate value"
                        }`,
                    ],
                });

            default:
                return res.status(500).json({
                    status: 500,
                    message: "Internal server error",
                });
        }
    }
}

// ─────────────────────────────────────────────────────────────────────
// REGISTER IT — in src/main.ts, after the app is created:
//
//   import { PrismaExceptionFilter } from "./filters/prisma-exception.filter";
//   ...
//   app.useGlobalFilters(new PrismaExceptionFilter());
//
// If you already call useGlobalFilters(), add this one to the same call —
// a second call replaces the first rather than adding to it.
// ─────────────────────────────────────────────────────────────────────
