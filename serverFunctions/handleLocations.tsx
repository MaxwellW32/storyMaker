"use server"
import { db } from "@/db";
import { locations } from "@/db/schema";
import { newLocationSchema, newLocationType, locationSchema, locationType, tableFilterTypes, updateLocationType, dbWithFileType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, desc, eq, SQLWrapper } from "drizzle-orm";
import { ensureCanAccessResource, sessionCheck } from "./handleAuth";
import { revalidatePath } from "next/cache";
import path from "path";
import { imagesDirName, locationsDirName, uploadedDataDir } from "@/lib/dirPaths";
import fs from "fs/promises"

export async function addLocation(newLocationObj: newLocationType): Promise<locationType> {
    const session = await sessionCheck()

    //security check  
    newLocationSchema.parse(newLocationObj)

    newLocationObj.userId = session.user.id

    //add new
    const [addedLocation] = await db.insert(locations).values({
        ...newLocationObj,
    }).returning()

    return addedLocation
}

export async function getLocations(filter: tableFilterTypes<locationType>, getWith: { [key in keyof locationType]?: true } = {}, limit = 50, offset = 0,): Promise<locationType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(locationSchema.partial(), filter, locations)

    const results = await db.query.locations.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith,
        }
    });

    console.log(`$results`, results);

    return results;
}

export async function updateLocation(locationId: locationType["id"], locationObj: Partial<updateLocationType>): Promise<locationType> {
    //validation
    locationSchema.partial().parse(locationObj)

    //auth
    await ensureCanAccessResource("locations", locationId)

    const [result] = await db.update(locations)
        .set({
            ...locationObj
        })
        .where(eq(locations.id, locationId)).returning()

    return result
}

export async function getSpecificLocation(locationId: locationType["id"], getWith: { [key in keyof locationType]?: true } = {},): Promise<locationType | undefined> {
    locationSchema.shape.id.parse(locationId)

    const result = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
        with: {
            ...getWith
        },
    });

    return result
}

export async function deleteLocation(locationId: locationType["id"]) {
    //validation
    locationSchema.shape.id.parse(locationId)

    //auth
    await ensureCanAccessResource("locations", locationId)

    await db.delete(locations).where(eq(locations.id, locationId));
}

export async function deleteImageForView(locationId: locationType["id"], dbWithFilesObjs: dbWithFileType[]) {
    //validation
    locationSchema.shape.id.parse(locationId)

    //delete from folder
    await Promise.all(dbWithFilesObjs.map(async eachDbWithFileObj => {
        const baseFolderPath = path.join(uploadedDataDir, locationsDirName, locationId, imagesDirName)
        console.log(`$baseFolderPath`, baseFolderPath)
        try {
            // Read all files in the folder
            const files = await fs.readdir(baseFolderPath);

            // Filter to find files containing the imageSrc in their name
            const fileUUidOnly = eachDbWithFileObj.file.src.split(".")[0]
            console.log(`$fileUUidOnly`, fileUUidOnly)

            const matchingFiles = files.filter((file) => file.includes(fileUUidOnly));
            console.log(`$matchingFiles`, matchingFiles)

            // Delete each matching file
            await Promise.all(
                matchingFiles.map(async (file) => {
                    const filePath = path.join(baseFolderPath, file);
                    await fs.rm(filePath, { force: true });
                })
            );

        } catch (err: any) {
            if (err.code === "ENOENT") {
                // Folder doesn’t exist, nothing to delete
            }

            throw err;
        }
    })
    )
}