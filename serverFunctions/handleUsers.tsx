"use server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { newUserSchema, newUserType, userSchema, userType, tableFilterTypes } from "@/types"
import { and, eq, SQLWrapper } from "drizzle-orm"
import { makeWhereClauses } from "@/utility/utility"

export async function addUser(newUserObj: newUserType) {
    //validation
    const validatedUser = newUserSchema.parse(newUserObj)

    //add new request
    await db.insert(users).values({
        ...validatedUser
    })
}

export async function updateUser(userId: userType["id"], updatedUserObj: Partial<userType>) {
    //validation
    userSchema.partial().parse(updatedUserObj)

    await db.update(users)
        .set({
            ...updatedUserObj
        })
        .where(eq(users.id, userId));
}

export async function deleteUser(userId: userType["id"]) {
    //validation
    userSchema.shape.id.parse(userId)

    await db.delete(users).where(eq(users.id, userId));
}

export async function getSpecificUser(userId: userType["id"]): Promise<userType | undefined> {
    userSchema.shape.id.parse(userId)

    const result = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    return result
}

export async function getUsers(filter: tableFilterTypes<userType>, getWith?: { [key in keyof userType]?: true }, limit = 50, offset = 0,): Promise<userType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(userSchema.partial(), filter, users)

    const results = await db.query.users.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: getWith === undefined ? undefined : {
        }
    });

    return results;
}