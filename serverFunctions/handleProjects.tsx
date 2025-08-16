"use server"
import { db } from "@/db";
import { projects } from "@/db/schema";
import { newProjectSchema, newProjectType, projectSchema, projectType, tableFilterTypes, updateProjectType } from "@/types";
import { makeWhereClauses } from "@/utility/utility";
import { and, desc, eq, SQLWrapper } from "drizzle-orm";
import { ensureCanAccessResource, sessionCheck } from "./handleAuth";
import { revalidatePath } from "next/cache";
import path from "path";
import { imagesDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";
import fs from "fs/promises"

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

export async function getProjects(filter: tableFilterTypes<projectType>, getWith: { [key in keyof projectType]?: true } = {}, limit = 50, offset = 0,): Promise<projectType[]> {
    //compile filters into proper where clauses
    const whereClauses: SQLWrapper[] = makeWhereClauses(projectSchema.partial(), filter, projects)

    const results = await db.query.projects.findMany({
        where: and(...whereClauses),
        limit,
        offset,
        with: {
            ...getWith,
        },
        orderBy: [desc(projects.dateCreated)],
    });

    return results;
}

// export async function updateOldScenesInProject() {
//     //get all projects
//     //go over each
//     //edit their scenes with the new value
//     //save

//     const allProjects = await getProjects({})
//     await Promise.all(allProjects.map(async eachProject => {
//         eachProject.scenes = eachProject.scenes.map(eachScene => {

//             const oldScene = eachScene as unknown as sceneOldType

//             const newScene: sceneType = {
//                 ...oldScene,
//                 locationId: "dummyData",
//                 viewId: "dummyData",
//             }

//             sceneSchema.parse(newScene)

//             return newScene
//         })

//         //update with new sceneObj
//         await updateProject(eachProject.id, { scenes: eachProject.scenes })
//     }))
// }

export async function updateProject(projectId: projectType["id"], projectObj: Partial<updateProjectType>): Promise<projectType> {
    //validation
    projectSchema.partial().parse(projectObj)

    console.log(`$projectObj`, JSON.stringify(projectObj, null, 2));

    //auth
    await ensureCanAccessResource("projects", projectId)

    const [result] = await db.update(projects)
        .set({
            ...projectObj
        })
        .where(eq(projects.id, projectId)).returning()

    return result
}

export async function getSpecificProject(projectId: projectType["id"], getWith: { [key in keyof projectType]?: true } = {},): Promise<projectType | undefined> {
    projectSchema.shape.id.parse(projectId)

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
            ...getWith,
            charactersToProjects: getWith.charactersToProjects === undefined ? {
                with: {
                    character: {
                        with: {
                            charactersToEmotions: true
                        }
                    }
                }
            } : getWith.charactersToProjects,
            locationsToProjects: getWith.locationsToProjects === undefined ? {
                with: {
                    location: true
                }
            } : getWith.locationsToProjects,
        },
    });

    return result
}

export async function deleteProject(projectId: projectType["id"]) {
    //validation
    projectSchema.shape.id.parse(projectId)

    //auth
    await ensureCanAccessResource("projects", projectId)

    await db.delete(projects).where(eq(projects.id, projectId));
}

export async function refreshProjectPath(projectId: projectType["id"]) {
    projectSchema.shape.id.parse(projectId)

    revalidatePath(`/projects/view/${projectId}`)
}

export async function deleteSceneBackgroundImage(
    projectId: projectType["id"],
    imageSrc: string //containing scene id
) {
    // Validate projectId
    projectSchema.shape.id.parse(projectId);

    // Auth check
    await ensureCanAccessResource("projects", projectId);

    // Path to the folder containing images
    const baseFolderPath = path.join(
        uploadedDataDir,
        projectsDirName,
        projectId,
        imagesDirName
    );

    try {
        // Read all files in the folder
        const files = await fs.readdir(baseFolderPath);

        // Filter to find files containing the imageSrc in their name
        const matchingFiles = files.filter((file) => file.includes(imageSrc));

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
}