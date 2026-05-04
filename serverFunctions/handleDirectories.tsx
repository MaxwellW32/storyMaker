"use server"
import { convertBtyes } from "@/utility/utility";
import path from "path";
import fs from "fs/promises"
import { ensureDirectoryExists } from "@/utility/manageFiles";
import { allowedImageFileTypes, maxFileUploadSize } from "@/lib/uploadFilesLib";

export async function writeFilesToUploadDir(filePath: string, formData: FormData, fileType: "images" | "other") {
    //get folder
    await ensureDirectoryExists(filePath);

    const body = Object.fromEntries(formData);

    const addedFileNames = await Promise.all(Object.entries(body).map(async eachEntry => {
        const eachEntryKey = eachEntry[0] //file id
        const eachEntryValue = eachEntry[1]

        const file = eachEntryValue as File;

        const documentPath = path.join(filePath, eachEntryKey)

        // Check if file proper file type
        const allowedFileTypes = fileType === "images" ? allowedImageFileTypes : null
        if (allowedFileTypes === null) throw new Error("inavlid fileType selection")
        if (!allowedFileTypes.includes(file.type)) throw new Error("Invalid file type");

        // Check the file size
        if (file.size > maxFileUploadSize) {
            throw new Error(`File is too large. Maximum size is ${convertBtyes(maxFileUploadSize, "mb")} MB`)
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        //actual write
        await fs.writeFile(documentPath, buffer);

        return eachEntryKey
    }))

    return {
        names: addedFileNames,
    }
}