import { DeckType, PrismaClient, User, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

async function main() {
    const fakerRounds = 10;
    console.log("Seeding ...");
    /// --------- Users ---------------
    await prisma.codeDeck.deleteMany();
    await prisma.userDeck.deleteMany();
    await prisma.card.deleteMany();
    await prisma.deck.deleteMany();
    await prisma.code.deleteMany();
    await prisma.user.deleteMany();
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
