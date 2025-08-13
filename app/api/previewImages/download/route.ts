import path from "path";
import { downloadFile } from "@/utility/manageFiles";
import { previewImagesDirName, uploadedDataDir } from "@/lib/dirPaths";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    //get src
    const src = searchParams.get("src");
    if (!src) throw new Error("src not sent");

    const imagePath = path.join(uploadedDataDir, previewImagesDirName, src)

    return downloadFile(imagePath)
}