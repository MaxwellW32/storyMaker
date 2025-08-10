import JSZip from "jszip";
import path from "path";
import fs from "fs/promises";
import { checkIfDirectoryExists, ensureDirectoryExists } from "@/utility/manageFiles";
import { downloadProjectBodySchema } from "@/types";
import { getSpecificProject } from "@/serverFunctions/handleProjects";
import { afterEffectsProjectScriptFile, charactersDirName, imagesDirName, projectsDirName, projectStagingAreaDir, uploadedDataDir } from "@/lib/dirPaths";
import { ensureCanAccessResource } from "@/serverFunctions/handleAuth";

export async function POST(request: Request) {
  //parse body
  const seenDownloadProjectBody = downloadProjectBodySchema.parse(await request.json())

  //fetch website
  const seenProject = await getSpecificProject(seenDownloadProjectBody.projectId)
  if (seenProject === undefined) throw new Error("not seeing project")

  //auth check
  await ensureCanAccessResource("projects", seenDownloadProjectBody.projectId)

  const stagingBaseDir = path.join(projectStagingAreaDir, seenProject.id)

  //if baseFolder already exists delete it
  if (await checkIfDirectoryExists(stagingBaseDir)) {
    await fs.rm(stagingBaseDir, { force: true, recursive: true })
  }
  //make baseFolder
  await ensureDirectoryExists(stagingBaseDir)

  // // make staging project folder
  const stagingProjectDir = path.join(stagingBaseDir, "project")
  await ensureDirectoryExists(stagingProjectDir)

  //copy the project files
  const projectFolderDirPath = path.join(uploadedDataDir, projectsDirName, seenProject.id)
  await fs.cp(projectFolderDirPath, stagingProjectDir, { recursive: true })



  //copy the characters to my base path
  if (seenProject.charactersToProjects === undefined || seenProject.charactersToProjects.length === 0) throw new Error("not seeing charactersInProject")

  //ensure required character folders exist: character folder, images
  await Promise.all(seenProject.charactersToProjects.map(async eachCharacterInProject => {
    //character folder path
    const characterFolderPath = path.join(uploadedDataDir, charactersDirName, eachCharacterInProject.characterId)
    await ensureDirectoryExists(characterFolderPath)

    //character images path
    const characterFolderImagesPath = path.join(characterFolderPath, imagesDirName)
    await ensureDirectoryExists(characterFolderImagesPath)

    //add more when needed
  })
  )

  //copy to the stagin folder
  await Promise.all(seenProject.charactersToProjects.map(async eachCharacterInProject => {
    //make characters staging folder
    const stagingCharactersDir = path.join(stagingBaseDir, charactersDirName, eachCharacterInProject.characterId)
    await ensureDirectoryExists(stagingCharactersDir)

    //get the character folder
    const characterFolderPath = path.join(uploadedDataDir, charactersDirName, eachCharacterInProject.characterId)

    //copy to the staging area
    await fs.cp(characterFolderPath, stagingCharactersDir, { recursive: true })
  })
  )






  //make script
  //get file name
  const afterEffectsProjectScriptSplitArr = afterEffectsProjectScriptFile.split("\\")
  const afterEffectsScriptFileName = afterEffectsProjectScriptSplitArr[afterEffectsProjectScriptSplitArr.length - 1]

  //read and update script
  const afterEffectsProjectScriptText = await fs.readFile(afterEffectsProjectScriptFile, { encoding: "utf-8" })
  const updatedAfterEffectsProjectScriptText = afterEffectsProjectScriptText.replace("[[seenProject]]", JSON.stringify(seenProject, null, 2))

  //write the script to the staging area
  const stagingAfterEffectsScriptFilePath = path.join(stagingBaseDir, afterEffectsScriptFileName)
  await fs.writeFile(stagingAfterEffectsScriptFilePath, updatedAfterEffectsProjectScriptText);







































  //zip the folder
  const zip = new JSZip();
  // Function to recursively add files and directories to the zip object
  const addFolderToZip = async (folderPath: string, relativePath: string) => {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const relativeFilePath = path.join(relativePath, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await addFolderToZip(filePath, relativeFilePath); // Recursively add subdirectories

      } else {
        const fileData = await fs.readFile(filePath);
        zip.file(relativeFilePath, fileData); // Add file to zip
      }
    }
  };

  // Add the entire temp folder to the zip object
  await addFolderToZip(stagingBaseDir, "");
  const archive = await zip.generateAsync({ type: "blob" });

  //send zipped file to client
  return new Response(archive);
}