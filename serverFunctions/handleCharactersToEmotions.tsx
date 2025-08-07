"use server"
import { db } from "@/db";
import { charactersToEmotions } from "@/db/schema";
import { newCharacterToEmotionSchema, newCharacterToEmotionType, characterToEmotionSchema, characterToEmotionType, tableFilterTypes, updateCharacterToEmotionType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addCharacterToEmotion(newCharacterToEmotionObj: newCharacterToEmotionType): Promise<characterToEmotionType> {
    //valdiation  
    newCharacterToEmotionSchema.parse(newCharacterToEmotionObj)

    //add new
    const [addedCharacterToEmotion] = await db.insert(charactersToEmotions).values({
        ...newCharacterToEmotionObj,
    }).returning()

    return addedCharacterToEmotion
}

export async function getCharacterToEmotions(filter: tableFilterTypes<characterToEmotionType>, getWith: { [key in keyof characterToEmotionType]?: true } = {}, limit = 50, offset = 0,): Promise<characterToEmotionType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(characterToEmotionSchema.partial(), filter, charactersToEmotions)

    const results = await db.query.charactersToEmotions.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith
        },
    });

    return results;
}

export async function updateCharacterToEmotion({ characterId, emotionType, characterToEmotionObj }: { characterId: characterToEmotionType["characterId"], emotionType: characterToEmotionType["emotionType"], characterToEmotionObj: Partial<updateCharacterToEmotionType> }): Promise<characterToEmotionType> {
    //validation
    characterToEmotionSchema.shape.characterId.parse(characterId)
    characterToEmotionSchema.shape.emotionType.parse(emotionType)
    characterToEmotionSchema.partial().parse(characterToEmotionObj)

    const [result] = await db.update(charactersToEmotions)
        .set({
            ...characterToEmotionObj
        })
        .where(and(eq(charactersToEmotions.characterId, characterId), eq(charactersToEmotions.emotionType, emotionType))).returning()

    return result
}

export async function getSpecificCharacterToEmotion({ characterId, emotionType }: { characterId: characterToEmotionType["characterId"], emotionType: characterToEmotionType["emotionType"] }): Promise<characterToEmotionType | undefined> {
    //validation
    characterToEmotionSchema.shape.characterId.parse(characterId)
    characterToEmotionSchema.shape.emotionType.parse(emotionType)

    const result = await db.query.charactersToEmotions.findFirst({
        where: and(eq(charactersToEmotions.characterId, characterId), eq(charactersToEmotions.emotionType, emotionType)),
    });

    return result
}

export async function deleteCharacterToEmotion({ characterId, emotionType }: { characterId: characterToEmotionType["characterId"], emotionType: characterToEmotionType["emotionType"] }) {
    //validation
    characterToEmotionSchema.shape.characterId.parse(characterId)
    characterToEmotionSchema.shape.emotionType.parse(emotionType)

    //more logic for file deletion
    await db.delete(charactersToEmotions).where(and(eq(charactersToEmotions.characterId, characterId), eq(charactersToEmotions.emotionType, emotionType)));
}