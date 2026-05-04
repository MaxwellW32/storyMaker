"use server"
import { db } from "@/db";
import { tags } from "@/db/schema";
import { newTagSchema, newTagType, tagSchema, tagType, tableFilterTypes, updateTagType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addTag(newTagObj: newTagType) {
    //security check  
    newTagSchema.parse(newTagObj)

    //add new
    await db.insert(tags).values({
        ...newTagObj,
    })
}

export async function getTags(filter: tableFilterTypes<tagType>, getWith: { [key in keyof tagType]?: true } = {}, limit = 50, offset = 0,): Promise<tagType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(tagSchema.partial(), filter, tags)

    const results = await db.query.tags.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith,
        },
    });

    return results;
}

export async function updateTag(tagId: tagType["id"], tagObj: Partial<updateTagType>): Promise<tagType> {
    //validation
    tagSchema.partial().parse(tagObj)

    const [result] = await db.update(tags)
        .set({
            ...tagObj
        })
        .where(eq(tags.id, tagId)).returning()

    return result
}

export async function getSpecificTag(tagId: tagType["id"]): Promise<tagType | undefined> {
    tagSchema.shape.id.parse(tagId)

    const result = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
    });

    return result
}

export async function deleteTag(tagId: tagType["id"]) {
    //validation
    tagSchema.shape.id.parse(tagId)

    //more logic for file deletion
    await db.delete(tags).where(eq(tags.id, tagId));
}