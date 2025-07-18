"use server"
import { db } from "@/db";
import { projects } from "@/db/schema";
import { newProjectSchema, newProjectType, projectFilterType, projectSchema, projectType, updateProjectType } from "@/types";
import { and, desc, eq, ne, sql, SQLWrapper } from "drizzle-orm";

export async function addProjects(newProjectObj: newProjectType): Promise<projectType> {
    //security check  
    newProjectSchema.parse(newProjectObj)

    //add new
    const [addedProject] = await db.insert(projects).values({
        ...newProjectObj,
    }).returning()

    return addedProject
}

export async function getProjects(filter: projectFilterType, limit = 50, offset = 0): Promise<projectType[]> {
    // Collect conditions dynamically
    const whereClauses: SQLWrapper[] = []

    if (filter.id !== undefined) {
        whereClauses.push(eq(projects.id, filter.id))
    }

    if (filter.name !== undefined) {
        whereClauses.push(eq(projects.name, filter.name))
    }

    const results = await db.query.projects.findMany({
        where: and(...whereClauses),
        limit: limit,
        offset: offset,
        orderBy: [desc(projects.dateCreated)],
    });

    return results
}

export async function updateProjects(projectId: projectType["id"], projectObj: Partial<updateProjectType>): Promise<projectType> {
    //validation
    projectSchema.partial().parse(projectObj)

    const [result] = await db.update(projects)
        .set({
            ...projectObj
        })
        .where(eq(projects.id, projectId)).returning()

    return result
}

export async function getSpecificProjects(projectId: projectType["id"]): Promise<projectType | undefined> {
    projectSchema.shape.id.parse(projectId)

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    return result
}

export async function deleteProjects(projectId: projectType["id"]) {
    //validation
    projectSchema.shape.id.parse(projectId)

    //more logic for file deletion

    await db.delete(projects).where(eq(projects.id, projectId));
}