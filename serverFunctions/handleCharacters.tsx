"use server"
import { db } from "@/db";
import { characters } from "@/db/schema";
import { newCharacterSchema, newCharacterType, characterSchema, characterType, tableFilterTypes, updateCharacterType, dbWithFileType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";
import { ensureCanAccessResource, sessionCheck } from "./handleAuth";
import path from "path";
import fs from "fs/promises"
import { charactersDirName, imagesDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function addCharacter(newCharacterObj: newCharacterType): Promise<characterType> {
    const session = await sessionCheck()

    //security check  
    newCharacterSchema.parse(newCharacterObj)

    //add on user id
    newCharacterObj.userId = session.user.id

    //add new
    const [result] = await db.insert(characters).values({
        ...newCharacterObj,
    }).returning()

    return result
}

export async function getCharacters(filter: tableFilterTypes<characterType>, getWith: { [key in keyof characterType]?: true } = {}, limit = 50, offset = 0,): Promise<characterType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(characterSchema.partial(), filter, characters)

    const results = await db.query.characters.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith,
            charactersToEmotions: getWith.charactersToEmotions === undefined ? true : getWith.charactersToEmotions,
            charactersToTags: getWith.charactersToTags === undefined ? true : getWith.charactersToTags
        },
    });

    return results;
}

export async function updateCharacter(characterId: characterType["id"], characterObj: Partial<updateCharacterType>): Promise<characterType> {
    //validation
    characterSchema.partial().parse(characterObj)

    //auth
    await ensureCanAccessResource("characters", characterId)

    const [result] = await db.update(characters)
        .set({
            ...characterObj,
        })
        .where(eq(characters.id, characterId)).returning()

    return result
}

export async function getSpecificCharacter(characterId: characterType["id"], getWith: { [key in keyof characterType]?: true } = {},): Promise<characterType | undefined> {
    characterSchema.shape.id.parse(characterId)

    const result = await db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        with: {
            ...getWith,
            charactersToEmotions: getWith.charactersToEmotions === undefined ? true : getWith.charactersToEmotions,
            charactersToTags: getWith.charactersToTags === undefined ? true : getWith.charactersToTags
        },
    });

    return result
}

export async function deleteCharacter(characterId: characterType["id"]) {
    //validation
    characterSchema.shape.id.parse(characterId)

    //auth
    await ensureCanAccessResource("characters", characterId)

    await db.delete(characters).where(eq(characters.id, characterId));
}

export async function deleteImageForCharacter(characterId: characterType["id"], dbWithFilesObjs: dbWithFileType[]) {
    //validation
    characterSchema.shape.id.parse(characterId)

    //delete from folder
    await Promise.all(dbWithFilesObjs.map(async eachDbWithFileObj => {
        const baseFolderPath = path.join(uploadedDataDir, charactersDirName, characterId, imagesDirName, eachDbWithFileObj.file.src)

        await fs.rm(baseFolderPath, { force: true, recursive: true })
    })
    )
}