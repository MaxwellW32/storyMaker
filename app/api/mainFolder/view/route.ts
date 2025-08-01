import path from "path";
import fs from "fs/promises";
import { NextResponse } from "next/server";
import { mainFolderDir } from "@/lib/dirPaths";
import { textFileApiResponseSchema, textFileApiResponseType } from "@/types";

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams

    const wantedFilePath = searchParams.get("filePath")
    if (wantedFilePath === null) throw new Error("not seeing file path")

    const filePath = path.join(process.cwd(), wantedFilePath)

    //auth
    if (!filePath.toLowerCase().includes(mainFolderDir.toLowerCase())) throw new Error("can only access from mainFolder")

    const fileContent = await fs.readFile(filePath, { encoding: "utf-8" });

    const newTextFileApiResponse: textFileApiResponseType = {
        fileContent: fileContent
    }
    textFileApiResponseSchema.parse(newTextFileApiResponse)

    return NextResponse.json(newTextFileApiResponse);
}