import path from "path";

export const mainFolderDir = path.join("mainFolder")
export const baseFolderDir = path.join(mainFolderDir, "base")
export const baseInstructionsPromptFilepath = path.join(baseFolderDir, "baseInstructionsPrompt.txt")

export const projectResourcesDir = path.join(process.cwd(), "projectResources")
export const projectAudioDir = path.join(projectResourcesDir, "audio")
export const projectImagesDir = path.join(projectResourcesDir, "images")