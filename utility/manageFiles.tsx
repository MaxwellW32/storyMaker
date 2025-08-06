import { projectResourcesDir } from "@/lib/dirPaths";
import { writeFileOptions, projectResourceDirOptionsType, projectType } from "@/types";
import fs from "fs/promises";
import path from "path";
import { v4 as uudiv4 } from "uuid"

export async function ensureDirectoryExists(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
}

export async function checkIfDirectoryExists(dirPath: string) {
    try {
        // Check if the directory exists by attempting to read it
        await fs.access(dirPath);

        return true

    } catch (err) {
        // If an error occurs (e.g., directory does not exist), create the directory
        //@ts-expect-error ts not seeing type
        if (err.code === 'ENOENT') {
            return false

        } else {
            console.error('Error checking directory:', err);
            throw new Error("error reading dir")
        }
    }
}

export async function writeToProjectResources(projectResourceDir: projectResourceDirOptionsType, projectId: projectType["id"], writeFile: writeFileOptions) {
    const dirPath = path.join(projectResourcesDir, projectResourceDir, projectId)
    await ensureDirectoryExists(dirPath)

    const newId = `${projectResourceDir}_${uudiv4()}`

    if (writeFile.type === "text") {
        const filePath = path.join(dirPath, `${newId}.txt`)

        await fs.writeFile(filePath, writeFile.text, { encoding: "utf-8" })

    } else if (writeFile.type === "audio") {
        const stream = writeFile.audioFile as ReadableStream;
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        const filePath = path.join(dirPath, `${newId}.mp3`)

        await fs.writeFile(filePath, buffer)
    }
}