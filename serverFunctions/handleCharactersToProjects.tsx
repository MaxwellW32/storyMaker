"use server"
import { db } from "@/db";
import { charactersToProjects } from "@/db/schema";
import { newCharacterToProjectSchema, newCharacterToProjectType, characterToProjectSchema, characterToProjectType, tableFilterTypes, updateCharacterToProjectType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addCharacterToProject(newCharacterToProjectObj: newCharacterToProjectType): Promise<characterToProjectType> {
    //valdiation  
    newCharacterToProjectSchema.parse(newCharacterToProjectObj)

    //add new
    const [addedCharacterToProject] = await db.insert(charactersToProjects).values({
        ...newCharacterToProjectObj,
    }).returning()

    return addedCharacterToProject
}

export async function getCharacterToProjects(filter: tableFilterTypes<characterToProjectType>, getWith: { [key in keyof characterToProjectType]?: true } = {}, limit = 50, offset = 0,): Promise<characterToProjectType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(characterToProjectSchema.partial(), filter, charactersToProjects)

    const results = await db.query.charactersToProjects.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith
        },
    });

    return results;
}

export async function updateCharacterToProject({ characterId, projectId, characterToProjectObj }: { characterId: characterToProjectType["characterId"], projectId: characterToProjectType["projectId"], characterToProjectObj: Partial<updateCharacterToProjectType> }): Promise<characterToProjectType> {
    //validation
    characterToProjectSchema.shape.characterId.parse(characterId)
    characterToProjectSchema.shape.projectId.parse(projectId)
    characterToProjectSchema.partial().parse(characterToProjectObj)

    const [result] = await db.update(charactersToProjects)
        .set({
            ...characterToProjectObj
        })
        .where(and(eq(charactersToProjects.characterId, characterId), eq(charactersToProjects.projectId, projectId))).returning()

    return result
}

export async function getSpecificCharacterToProject({ characterId, projectId }: { characterId: characterToProjectType["characterId"], projectId: characterToProjectType["projectId"] }): Promise<characterToProjectType | undefined> {
    //validation
    characterToProjectSchema.shape.characterId.parse(characterId)
    characterToProjectSchema.shape.projectId.parse(projectId)

    const result = await db.query.charactersToProjects.findFirst({
        where: and(eq(charactersToProjects.characterId, characterId), eq(charactersToProjects.projectId, projectId)),
    });

    return result
}

export async function deleteCharacterToProject({ characterId, projectId }: { characterId: characterToProjectType["characterId"], projectId: characterToProjectType["projectId"] }) {
    //validation
    characterToProjectSchema.shape.characterId.parse(characterId)
    characterToProjectSchema.shape.projectId.parse(projectId)

    //more logic for file deletion
    await db.delete(charactersToProjects).where(and(eq(charactersToProjects.characterId, characterId), eq(charactersToProjects.projectId, projectId)));
}