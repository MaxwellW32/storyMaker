"use server"
import { db } from "@/db";
import { characters } from "@/db/schema";
import { characterSchema, characterType } from "@/types";
import { eq } from "drizzle-orm";

export async function getSpecificUser(userId: characterType["id"]): Promise<characterType | undefined> {
    characterSchema.shape.id.parse(userId)

    const result = await db.query.characters.findFirst({
        where: eq(characters.id, userId),
    });

    return result
}