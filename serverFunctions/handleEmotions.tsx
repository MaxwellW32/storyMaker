"use server"
import { db } from "@/db";
import { emotions } from "@/db/schema";
import { newEmotionSchema, newEmotionType, emotionSchema, emotionType, tableFilterTypes, updateEmotionType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addEmotion(newEmotionObj: newEmotionType) {
    //security check  
    newEmotionSchema.parse(newEmotionObj)

    //add new
    await db.insert(emotions).values({
        ...newEmotionObj,
    })
}

export async function getEmotions(filter: tableFilterTypes<emotionType>, getWith: { [key in keyof emotionType]?: true } = {}, limit = 50, offset = 0,): Promise<emotionType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(emotionSchema.partial(), filter, emotions)

    const results = await db.query.emotions.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith,
        },
    });

    return results;
}

export async function updateEmotion(emotionType: emotionType["type"], emotionObj: Partial<updateEmotionType>): Promise<emotionType> {
    //validation
    emotionSchema.partial().parse(emotionObj)

    const [result] = await db.update(emotions)
        .set({
            ...emotionObj
        })
        .where(eq(emotions.type, emotionType)).returning()

    return result
}

export async function getSpecificEmotion(emotionType: emotionType["type"]): Promise<emotionType | undefined> {
    emotionSchema.shape.type.parse(emotionType)

    const result = await db.query.emotions.findFirst({
        where: eq(emotions.type, emotionType),
    });

    return result
}

export async function deleteEmotion(emotionType: emotionType["type"]) {
    //validation
    emotionSchema.shape.type.parse(emotionType)

    //more logic for file deletion
    await db.delete(emotions).where(eq(emotions.type, emotionType));
}