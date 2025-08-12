"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptNewCharacterResponseSchema, gptMakeScenesResponseSchema, gptStoryResponseSchema, sceneType, gptMakeDialogueResponseSchema, dialogueType, newCharacterType, activeCharacterAppearanceType, gptCondensePromptResponseSchema } from "@/types";
import { v4 as uuidV4 } from "uuid"
import path from "path";
import fs from "fs/promises";
import { imagesDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";
import { ensureDirectoryExists } from "@/utility/manageFiles";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPEN_API_KEY

const openai = new OpenAI({
    apiKey: apiKey
});

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
export async function makeSceneBackgroundImages(prompt: string, projectId: string, scene: sceneType): Promise<{ src: string }> {
    console.log(`$prompt`, prompt);

    //condense prompt
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        input: prompt,
        text: {
            format: zodTextFormat(gptCondensePromptResponseSchema, "gptCondensePromptResponse"),
        },
    });
    const seenGptCondensePromptResponse = gptCondensePromptResponseSchema.parse(response.output_parsed)

    const condensedPrompt = seenGptCondensePromptResponse.prompt
    console.log(`$condensedPrompt`, condensedPrompt);

    //generate image for scene
    const result = await openai.images.generate({
        model: "dall-e-3",
        prompt: condensedPrompt,
        response_format: "b64_json"
    });
    if (result.data === undefined || result.data.length < 1) throw new Error("not seeing result data");

    // Create images dir
    const mainDirectory = path.join(uploadedDataDir, projectsDirName, projectId, imagesDirName);
    await ensureDirectoryExists(mainDirectory);

    const imageName = `${scene.id}___${uuidV4()}.png`;
    const documentPath = path.join(mainDirectory, imageName);

    // If base64 is returned
    if (result.data[0].b64_json === undefined) throw new Error("not seing image b64")
    const image_bytes = Buffer.from(result.data[0].b64_json, "base64");
    await fs.writeFile(documentPath, image_bytes);

    return {
        src: imageName
    }
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
export async function makeCharacterAppearanceImage(prompt: string): Promise<{ src: string }> {
    //generate image for scene
    const result = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        response_format: "url"
    });
    if (result.data === undefined || result.data.length < 1) throw new Error("not seeing result data");

    //ensure url
    if (result.data[0].url === undefined) throw new Error("not seing image url")

    return {
        src: result.data[0].url
    }
}