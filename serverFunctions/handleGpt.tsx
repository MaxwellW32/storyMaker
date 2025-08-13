"use server"
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptNewCharacterResponseSchema, gptMakeScenesResponseSchema, gptStoryResponseSchema, sceneType, gptMakeDialogueResponseSchema, dialogueType, newCharacterType, activeCharacterAppearanceType } from "@/types";
import { v4 as uuidV4 } from "uuid"
import { openai } from "@/lib/openai";
import path from "path";
import fs from "fs/promises";
import { previewImagesDirName, uploadedDataDir } from "@/lib/dirPaths";
import { cleanupOldFiles, ensureDirectoryExists } from "@/utility/manageFiles";

export async function makeStory(prompt: string, baseInstructions: string, activeCharacterAppearanceStarter: activeCharacterAppearanceType): Promise<sceneType[]> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
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
            activeCharacterAppearance: activeCharacterAppearanceStarter
        }
        return newScene
    })

    return newScenes
}
export async function makeScenes(prompt: string, baseInstructions: string, activeCharacterAppearanceStarter: activeCharacterAppearanceType): Promise<sceneType[]> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
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
            activeCharacterAppearance: activeCharacterAppearanceStarter
        }
        return newScene
    })

    return newScenes
}
export async function alterScene(prompt: string, baseInstructions: string, scene: sceneType): Promise<sceneType> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
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
        model: "gpt-4.1",
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
        model: "gpt-4.1",
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
export async function makeTempImage(prompt: string): Promise<{ src: string }> {
    //generate image for scene
    const result = await openai.images.generate({
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