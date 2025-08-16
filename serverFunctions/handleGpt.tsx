"use server"
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptNewCharacterResponseSchema, gptMakeScenesResponseSchema, gptStoryResponseSchema, sceneType, gptMakeDialogueResponseSchema, dialogueType, newCharacterType, activeAppearanceObjType, } from "@/types";
import { v4 as uuidV4 } from "uuid"
import { openai } from "@/lib/openai";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { previewImagesDirName, uploadedDataDir } from "@/lib/dirPaths";
import { cleanupOldFiles, ensureDirectoryExists } from "@/utility/manageFiles";
import { toFile } from "openai";
import { writeFilesToUploadDir } from "./handleDirectories";

export async function makeStory(prompt: string, baseInstructions: string, activeCharacterAppearanceStarter: activeAppearanceObjType): Promise<sceneType[]> {
    const response = await openai.responses.parse({
        model: "gpt-5-mini",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptStoryResponseSchema, "gptStoryResponse"),
        },
    });

    const seenGptStoryResponse = gptStoryResponseSchema.parse(response.output_parsed)
    const newScenes: sceneType[] = seenGptStoryResponse.scenes.map(eachScene => {
        //assign new ids to dialogue
        eachScene.dialogue = eachScene.dialogue.map(eachDialogue => {
            eachDialogue.id = uuidV4()

            return eachDialogue
        })

        const newScene: sceneType = {
            ...eachScene,
            id: uuidV4(),
            backgroundImageSrc: "",
            activeAppearanceObj: activeCharacterAppearanceStarter
        }
        return newScene
    })

    return newScenes
}
export async function makeScenes(prompt: string, baseInstructions: string, activeCharacterAppearanceStarter: activeAppearanceObjType): Promise<sceneType[]> {
    const response = await openai.responses.parse({
        model: "gpt-5-mini",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptMakeScenesResponseSchema, "gptMakeScenesResponse"),
        },
    });

    const seenGptMakeScenesResponse = gptMakeScenesResponseSchema.parse(response.output_parsed)

    const newScenes: sceneType[] = seenGptMakeScenesResponse.scenes.map(eachScene => {
        //assign new ids to dialogue
        eachScene.dialogue = eachScene.dialogue.map(eachDialogue => {
            eachDialogue.id = uuidV4()

            return eachDialogue
        })

        const newScene: sceneType = {
            ...eachScene,
            id: uuidV4(),
            backgroundImageSrc: "",
            activeAppearanceObj: activeCharacterAppearanceStarter
        }
        return newScene
    })

    return newScenes
}

// async function encodeImage(filePath: string) {
//     const base64Image = await fs.readFile(filePath, "base64");
//     return base64Image;
// }

// export async function makeSceneImages(prompt: string, projectId: projectType["id"], scene: sceneType, charactersInScene: characterType[], activeCharacterAppearance: activeCharacterAppearanceType, detail: "auto" | "low" | "high" = "auto") {
//     //go seen by scene
//     //read all character images in scene
//     //read all location view srcs 

//     //characterImageInputs
//     const characterImageInputs = await Promise.all(charactersInScene.map(async eachCharacterInScene => {
//         const appearanceId = activeCharacterAppearance[eachCharacterInScene.id]
//         if (appearanceId === undefined) throw new Error("not seeing appearanceId")

//         const foundAppearance = eachCharacterInScene.appearances.find(eachAppearance => eachAppearance.id === appearanceId)
//         if (foundAppearance === undefined) throw new Error("not seeing foundAppearance")

//         //get folder
//         const mainDirectory = path.join(uploadedDataDir, charactersDirName, eachCharacterInScene.id, imagesDirName);
//         await ensureDirectoryExists(mainDirectory);

//         //convert the file to b64
//         const documentPath = path.join(mainDirectory, foundAppearance.file.src);
//         const base64ImageUrl = await encodeImage(documentPath);

//         return {
//             type: "input_image",
//             image_url: `data:image/jpeg;base64,${base64ImageUrl}`,
//             detail: detail
//         }
//     }))

//     // //locationImageInputs
//     // const characterImageInputs = await Promise.all(charactersInScene.map(async eachCharacterInScene => {
//     //     const appearanceId = activeCharacterAppearance[eachCharacterInScene.id]
//     //     if (appearanceId === undefined) throw new Error("not seeing appearanceId")

//     //     const foundAppearance = eachCharacterInScene.appearances.find(eachAppearance => eachAppearance.id === appearanceId)
//     //     if (foundAppearance === undefined) throw new Error("not seeing foundAppearance")

//     //     //get folder
//     //     const mainDirectory = path.join(uploadedDataDir, charactersDirName, eachCharacterInScene.id, imagesDirName);
//     //     await ensureDirectoryExists(mainDirectory);

//     //     //convert the file to b64
//     //     const documentPath = path.join(mainDirectory, foundAppearance.file.src);
//     //     const base64ImageUrl = await encodeImage(documentPath);

//     //     return {
//     //         type: "input_image",
//     //         image_url: `data:image/jpeg;base64,${base64ImageUrl}`,
//     //         detail: detail
//     //     }
//     // }))
//     //e.g
//     const locationMainDirectory = path.join(uploadedDataDir, locationsDirName, "cfd442bf-7e0a-478e-8954-b10b9f8d853c", imagesDirName);
//     await ensureDirectoryExists(locationMainDirectory);

//     //convert the file to b64
//     const locationViewDocumentPath = path.join(locationMainDirectory, "b7bb2e37-8ba6-4bcb-82dc-c4d7276a6069.png"); //view file src
//     const locationViewBase64ImageUrl = await encodeImage(locationViewDocumentPath);

//     const locationImageInput = {
//         type: "input_image",
//         image_url: `data:image/jpeg;base64,${locationViewBase64ImageUrl}`,
//         detail: detail
//     }

//     const response = await openai.responses.create({
//         model: "gpt-5-mini",
//         input: [
//             {
//                 role: "user",
//                 content: [
//                     { type: "input_text", text: prompt },
//                     ...characterImageInputs as any,
//                     locationImageInput
//                 ],
//             },
//         ],
//         tools: [{ type: "image_generation" }],
//     });

//     const imageData = response.output
//         .filter((output) => output.type === "image_generation_call")
//         .map((output) => output.result);

//     if (imageData.length === 0) throw new Error("nto seeing imageData")

//     //get folder
//     const mainDirectory = path.join(uploadedDataDir, projectsDirName, projectId, imagesDirName);
//     await ensureDirectoryExists(mainDirectory);

//     //set the image name
//     const imageName = `${scene.id}.png`;
//     const documentPath = path.join(mainDirectory, imageName);

//     //get the base 64 data
//     const imageBase64 = imageData[0];
//     if (imageBase64 === null) throw new Error("not seeing imageBase64")

//     //save the file
//     const image_bytes = Buffer.from(imageBase64, "base64");
//     await fs.writeFile(documentPath, image_bytes);
// }
export async function alterScene(prompt: string, baseInstructions: string, scene: sceneType): Promise<sceneType> {
    const response = await openai.responses.parse({
        model: "gpt-5-mini",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptAlterSceneResponseSchema, "gptSceneResponse"),
        },
    });

    //keep same scene id
    const seenGptAlterSceneResponse = gptAlterSceneResponseSchema.parse(response.output_parsed)

    //assign new ids to dialogue
    seenGptAlterSceneResponse.scene.dialogue = seenGptAlterSceneResponse.scene.dialogue.map(eachDialogue => {
        eachDialogue.id = uuidV4()

        return eachDialogue
    })

    const alteredScene: sceneType = {
        ...scene,
        ...seenGptAlterSceneResponse.scene, //overwrites what it needs to
    }

    return alteredScene
}
export async function makeDialogue(prompt: string, baseInstructions: string): Promise<dialogueType[]> {
    const response = await openai.responses.parse({
        model: "gpt-5-mini",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptMakeDialogueResponseSchema, "gptMakeDialogueResponse"),
        },
    });

    const seenGptMakeDialogueResponse = gptMakeDialogueResponseSchema.parse(response.output_parsed)

    //assign new ids to dialogue
    seenGptMakeDialogueResponse.dialogue = seenGptMakeDialogueResponse.dialogue.map(eachDialogue => {
        eachDialogue.id = uuidV4()

        return eachDialogue
    })

    return seenGptMakeDialogueResponse.dialogue
}

export async function makeCharacter(prompt: string, baseInstructions: string): Promise<newCharacterType> {
    const response = await openai.responses.parse({
        model: "gpt-5-mini",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptNewCharacterResponseSchema, "gptNewCharacterResponse"),
        },
    });

    const seenGptNewCharacterResponse = gptNewCharacterResponseSchema.parse(response.output_parsed)

    //add on required fields
    const newCharacter: newCharacterType = {
        ...seenGptNewCharacterResponse.newCharacter,
        userId: "DummyData",
        voiceId: "",
        appearances: [],
    }

    return newCharacter
}
export async function makeTempImage(prompt: string, formData?: FormData): Promise<{ src: string }> {
    //upload all to temp directory
    let tempFiles: File[] = []
    if (formData !== undefined) {
        const mainDirectory = path.join(uploadedDataDir, previewImagesDirName);
        const uploadedTempFiles = await writeFilesToUploadDir(mainDirectory, formData, "images")

        //ensure exists
        await ensureDirectoryExists(mainDirectory);

        //get all temp files  
        tempFiles = await Promise.all(uploadedTempFiles.names.map(async eachFileName => {

            //convert the file to b64
            const documentPath = path.join(mainDirectory, eachFileName);
            return await toFile(fsSync.createReadStream(documentPath), null, {
                type: "image/png",
            })
        }))
    }

    //generate image for scene
    const result = formData !== undefined ? await openai.images.edit({
        model: "gpt-image-1",
        prompt,
        image: tempFiles,
    }) : await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        moderation: "low",
        //256x256, 512x512, or 1024x1024
        //input fidelity
    });

    if (result.data === undefined || result.data.length < 1) throw new Error("not seeing result data");

    // If base64 is returned
    if (result.data[0].b64_json === undefined) throw new Error("not seing image b64")
    const image_bytes = Buffer.from(result.data[0].b64_json, "base64");

    //get folder
    const mainDirectory = path.join(uploadedDataDir, previewImagesDirName);
    await ensureDirectoryExists(mainDirectory);

    const imageName = `${uuidV4()}.png`;
    const documentPath = path.join(mainDirectory, imageName);

    // Save the image to a file
    await fs.writeFile(documentPath, image_bytes);

    //clean up temp directory
    await cleanupOldFiles(mainDirectory)

    return {
        src: imageName
    }
}