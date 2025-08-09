"use server"
import path from "path";
import fs from "fs/promises";
import { dbFileType } from "@/types";
import { charactersDirName, imagesDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function deleteImages(imageSrcs: dbFileType["src"][]) {
    //remove file
    await Promise.all(
        imageSrcs.map(async eachSrc => {
            const baseFolderPath = path.join(uploadedDataDir, charactersDirName, imagesDirName, eachSrc)

            await fs.rm(baseFolderPath, { force: true, recursive: true })
        })
    )
}