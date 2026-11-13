import { Prisma } from "@/generated/prisma/client";

/** P2002 = violação de restrição única (ex.: @@unique([ownerId, name])). */
export function isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002 = violação de restrição única (ex.: @@unique([ownerId, name]))";
}
