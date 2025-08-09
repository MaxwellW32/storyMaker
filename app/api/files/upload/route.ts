import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import { ensureDirectoryExists } from "@/utility/manageFiles";
import { sessionCheck } from "@/serverFunctions/handleAuth";
import { dbFileTypeSchema } from "@/types";
import { convertBtyes } from "@/utility/utility";
import { charactersDirName, imagesDirName, uploadedDataDir } from "@/lib/dirPaths";
import { allowedImageFileTypes, maxFileUploadSize } from "@/lib/uploadFilesLib";

export async function POST(request: Request) {
    await sessionCheck()

    const formData = await request.formData();
    const body = Object.fromEntries(formData);

    const seenUploadType = dbFileTypeSchema.parse(body["type"])
    if (seenUploadType === undefined) throw new Error("not seeing upload type")

    const addedFileNamesPre = await Promise.all(
        Object.entries(body).map(async eachEntry => {
            const eachEntryKey = eachEntry[0] //file id
            const eachEntryValue = eachEntry[1]
            if (eachEntryKey === "type") return null //skip type declaration

            const file = eachEntryValue as File;

            const mainDirectory = seenUploadType === "image" ? path.join(uploadedDataDir, charactersDirName, imagesDirName) : null
            if (mainDirectory === null) throw new Error("mainDirectory null")

            //ensure directory exists
            await ensureDirectoryExists(mainDirectory)

            const documentPath = path.join(mainDirectory, eachEntryKey)

            // Check if file proper file type
            const allowedFileTypes = seenUploadType === "image" ? allowedImageFileTypes : null
            if (allowedFileTypes === null) throw new Error("allowedFileTypes null")
            if (!allowedFileTypes.includes(file.type)) throw new Error("Invalid file type");

            // Check the file size
            if (file.size > maxFileUploadSize) {
                throw new Error(`File is too large. Maximum size is ${convertBtyes(maxFileUploadSize, "mb")} MB`)
            }

            const buffer = Buffer.from(await file.arrayBuffer());

            await fs.writeFile(documentPath, buffer);

            return eachEntryKey
        })
    )
    const addedFileNames = addedFileNamesPre.filter(eachInvoiceName => eachInvoiceName !== null)

    return NextResponse.json({
        names: addedFileNames,
    });
}