"use server"
import { db } from "@/db";
import { projects } from "@/db/schema";
import { newProjectSchema, newProjectType, projectSchema, projectType, tableFilterTypes, updateProjectType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, desc, eq, SQLWrapper } from "drizzle-orm";
import { sessionCheck } from "./handleAuth";

export async function addProject(newProjectObj: newProjectType): Promise<projectType> {
    const session = await sessionCheck()

    //security check  
    newProjectSchema.parse(newProjectObj)

    newProjectObj.userId = session.user.id

    //add new
    const [addedProject] = await db.insert(projects).values({
        ...newProjectObj,
    }).returning()

    return addedProject
}

export async function getProjects(filter: tableFilterTypes<projectType>, getWith?: { [key in keyof projectType]?: true }, limit = 50, offset = 0,): Promise<projectType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(projectSchema.partial(), filter, projects)

    const results = await db.query.projects.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: getWith === undefined ? undefined : {
            fromUser: getWith.fromUser
        },
        orderBy: [desc(projects.dateCreated)],
    });

    return results;
}

export async function updateProject(projectId: projectType["id"], projectObj: Partial<updateProjectType>): Promise<projectType> {
    //validation
    projectSchema.partial().parse(projectObj)

    const [result] = await db.update(projects)
        .set({
            ...projectObj
        })
        .where(eq(projects.id, projectId)).returning()

    return result
}

export async function getSpecificProject(projectId: projectType["id"]): Promise<projectType | undefined> {
    projectSchema.shape.id.parse(projectId)

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    return result
}

export async function deleteProject(projectId: projectType["id"]) {
    //validation
    projectSchema.shape.id.parse(projectId)

    //more logic for file deletion

    await db.delete(projects).where(eq(projects.id, projectId));
}