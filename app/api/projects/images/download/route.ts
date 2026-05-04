import path from "path";
import { downloadFile } from "@/utility/manageFiles";
import { imagesDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    //get src
    const src = searchParams.get("src");
    if (!src) throw new Error("src not sent");

    //get character id
    const seenProjectId = searchParams.get("projectId");
    if (!seenProjectId) throw new Error("characterId not sent");

    const imagePath = path.join(uploadedDataDir, projectsDirName, seenProjectId, imagesDirName, src)
    return downloadFile(imagePath)
}