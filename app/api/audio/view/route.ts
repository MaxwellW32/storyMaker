import path from "path";
import { downloadFile } from "@/utility/manageFiles";
import { audioDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    //get projectId
    const projectId = searchParams.get("projectId");
    if (projectId === null) throw new Error("projectId not sent");

    //get fileName
    const fileName = searchParams.get("fileName");
    if (fileName === null) throw new Error("fileName not sent");

    const audioPath = path.join(uploadedDataDir, projectsDirName, projectId, audioDirName, fileName)

    //download audio
    return downloadFile(audioPath)
}