"use server"
import { db } from "@/db";
import { charactersToTags } from "@/db/schema";
import { newCharacterToTagSchema, newCharacterToTagType, characterToTagSchema, characterToTagType, tableFilterTypes, updateCharacterToTagType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addCharacterToTag(newCharacterToTagObj: newCharacterToTagType): Promise<characterToTagType> {
    //valdiation  
    newCharacterToTagSchema.parse(newCharacterToTagObj)

    //add new
    const [addedCharacterToTag] = await db.insert(charactersToTags).values({
        ...newCharacterToTagObj,
    }).returning()

    return addedCharacterToTag
}

export async function getCharacterToTags(filter: tableFilterTypes<characterToTagType>, getWith: { [key in keyof characterToTagType]?: true } = {}, limit = 50, offset = 0,): Promise<characterToTagType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(characterToTagSchema.partial(), filter, charactersToTags)

    const results = await db.query.charactersToTags.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith
        },
    });

    return results;
}

export async function updateCharacterToTag({ characterId, tagId, characterToTagObj }: { characterId: characterToTagType["characterId"], tagId: characterToTagType["tagId"], characterToTagObj: Partial<updateCharacterToTagType> }): Promise<characterToTagType> {
    //validation
    characterToTagSchema.shape.characterId.parse(characterId)
    characterToTagSchema.shape.tagId.parse(tagId)
    characterToTagSchema.partial().parse(characterToTagObj)

    const [result] = await db.update(charactersToTags)
        .set({
            ...characterToTagObj
        })
        .where(and(eq(charactersToTags.characterId, characterId), eq(charactersToTags.tagId, tagId))).returning()

    return result
}

export async function getSpecificCharacterToTag({ characterId, tagId }: { characterId: characterToTagType["characterId"], tagId: characterToTagType["tagId"] }): Promise<characterToTagType | undefined> {
    //validation
    characterToTagSchema.shape.characterId.parse(characterId)
    characterToTagSchema.shape.tagId.parse(tagId)

    const result = await db.query.charactersToTags.findFirst({
        where: and(eq(charactersToTags.characterId, characterId), eq(charactersToTags.tagId, tagId)),
    });

    return result
}

export async function deleteCharacterToTag({ characterId, tagId }: { characterId: characterToTagType["characterId"], tagId: characterToTagType["tagId"] }) {
    //validation
    characterToTagSchema.shape.characterId.parse(characterId)
    characterToTagSchema.shape.tagId.parse(tagId)

    //more logic for file deletion
    await db.delete(charactersToTags).where(and(eq(charactersToTags.characterId, characterId), eq(charactersToTags.tagId, tagId)));
}