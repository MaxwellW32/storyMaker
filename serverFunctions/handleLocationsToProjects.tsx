"use server"
import { db } from "@/db";
import { locationsToProjects } from "@/db/schema";
import { newLocationToProjectSchema, newLocationToProjectType, locationToProjectSchema, locationToProjectType, tableFilterTypes, updateLocationToProjectType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, eq, SQLWrapper } from "drizzle-orm";

export async function addLocationToProject(newLocationToProjectObj: newLocationToProjectType): Promise<locationToProjectType> {
    //valdiation  
    newLocationToProjectSchema.parse(newLocationToProjectObj)

    //add new
    const [addedLocationToProject] = await db.insert(locationsToProjects).values({
        ...newLocationToProjectObj,
    }).returning()

    return addedLocationToProject
}

export async function getLocationToProjects(filter: tableFilterTypes<locationToProjectType>, getWith: { [key in keyof locationToProjectType]?: true } = {}, limit = 50, offset = 0,): Promise<locationToProjectType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(locationToProjectSchema.partial(), filter, locationsToProjects)

    const results = await db.query.locationsToProjects.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith
        },
    });

    return results;
}

export async function updateLocationToProject({ locationId, projectId, locationToProjectObj }: { locationId: locationToProjectType["locationId"], projectId: locationToProjectType["projectId"], locationToProjectObj: Partial<updateLocationToProjectType> }): Promise<locationToProjectType> {
    //validation
    locationToProjectSchema.shape.locationId.parse(locationId)
    locationToProjectSchema.shape.projectId.parse(projectId)
    locationToProjectSchema.partial().parse(locationToProjectObj)

    const [result] = await db.update(locationsToProjects)
        .set({
            ...locationToProjectObj
        })
        .where(and(eq(locationsToProjects.locationId, locationId), eq(locationsToProjects.projectId, projectId))).returning()

    return result
}

export async function getSpecificLocationToProject({ locationId, projectId }: { locationId: locationToProjectType["locationId"], projectId: locationToProjectType["projectId"] }): Promise<locationToProjectType | undefined> {
    //validation
    locationToProjectSchema.shape.locationId.parse(locationId)
    locationToProjectSchema.shape.projectId.parse(projectId)

    const result = await db.query.locationsToProjects.findFirst({
        where: and(eq(locationsToProjects.locationId, locationId), eq(locationsToProjects.projectId, projectId)),
    });

    return result
}

export async function deleteLocationToProject({ locationId, projectId }: { locationId: locationToProjectType["locationId"], projectId: locationToProjectType["projectId"] }) {
    //validation
    locationToProjectSchema.shape.locationId.parse(locationId)
    locationToProjectSchema.shape.projectId.parse(projectId)

    //more logic for file deletion
    await db.delete(locationsToProjects).where(and(eq(locationsToProjects.locationId, locationId), eq(locationsToProjects.projectId, projectId)));
}