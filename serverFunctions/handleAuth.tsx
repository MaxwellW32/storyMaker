"use server";
import { auth } from "@/auth/auth";
import { tableNames } from "@/types";
import { getSpecificCharacter } from "./handleCharacters";
import { getSpecificProject } from "./handleProjects";
import { getSpecificLocation } from "./handleLocations";

export async function sessionCheck() {
    const session = await auth();

    if (session === null) throw new Error("No session found");

    return session;
}

export async function ensureCanAccessResource<T extends tableNames>(tableName: T, resourceId: string) {
    const session = await sessionCheck()

    if (tableName === "characters") {
        const seenCharacter = await getSpecificCharacter(resourceId)
        if (seenCharacter === undefined) throw new Error("not seeing character")

        if (session.user.id !== seenCharacter.userId) throw new Error("no authorized to edit character")

    } else if (tableName === "projects") {
        const seenProject = await getSpecificProject(resourceId)
        if (seenProject === undefined) throw new Error("not seeing project")

        if (session.user.id !== seenProject.userId) throw new Error("no authorized to edit project")

    } else if (tableName === "locations") {
        const seenLocation = await getSpecificLocation(resourceId)
        if (seenLocation === undefined) throw new Error("not seeing location")

        if (session.user.id !== seenLocation.userId) throw new Error("no authorized to edit project")

    } else {
        throw new Error("invalid option")
    }
}