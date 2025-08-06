"use server"
import { db } from "@/db";
import { characters } from "@/db/schema";
import { newCharacterSchema, newCharacterType, characterSchema, characterType, tableFilterTypes, updateCharacterType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";
import { sessionCheck } from "./handleAuth";

export async function addCharacter(newCharacterObj: newCharacterType) {
    const session = await sessionCheck()

    //security check  
    newCharacterSchema.parse(newCharacterObj)

    //add on user id
    newCharacterObj.userId = session.user.id

    //add new
    await db.insert(characters).values({
        ...newCharacterObj,
    })
}

export async function getCharacters(filter: tableFilterTypes<characterType>, getWith?: { [key in keyof characterType]?: true }, limit = 50, offset = 0,): Promise<characterType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(characterSchema.partial(), filter, characters)

    const results = await db.query.characters.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: getWith === undefined ? undefined : {
        },
    });

    return results;
}

export async function updateCharacter(characterId: characterType["id"], characterObj: Partial<updateCharacterType>): Promise<characterType> {
    //validation
    characterSchema.partial().parse(characterObj)

    const [result] = await db.update(characters)
        .set({
            ...characterObj
        })
        .where(eq(characters.id, characterId)).returning()

    return result
}

export async function getSpecificCharacter(characterId: characterType["id"]): Promise<characterType | undefined> {
    characterSchema.shape.id.parse(characterId)

    const result = await db.query.characters.findFirst({
        where: eq(characters.id, characterId),
    });

    return result
}

export async function deleteCharacter(characterId: characterType["id"]) {
    //validation
    characterSchema.shape.id.parse(characterId)

    //more logic for file deletion

    await db.delete(characters).where(eq(characters.id, characterId));
}