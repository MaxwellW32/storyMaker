import path from "path";
import { downloadFile } from "@/utility/manageFiles";
import { charactersDirName, imagesDirName, locationsDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    //get src
    const src = searchParams.get("src");
    if (!src) throw new Error("src not sent");

    //get character id
    const seenLocationId = searchParams.get("locationId");
    if (!seenLocationId) throw new Error("locationId not sent");

    const imagePath = path.join(uploadedDataDir, locationsDirName, seenLocationId, imagesDirName, src)

    return downloadFile(imagePath)
}