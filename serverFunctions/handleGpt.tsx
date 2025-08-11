"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptNewCharacterResponseSchema, gptMakeScenesResponseSchema, gptStoryResponseSchema, sceneType, gptMakeDialogueResponseSchema, dialogueType, newCharacterType, activeCharacterClothingType, projectType, gptCondensePromptResponseSchema, characterType } from "@/types";
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

export async function makeStory(prompt: string, baseInstructions: string, activeCharacterClothingStarter: activeCharacterClothingType): Promise<sceneType[]> {
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
            activeCharacterClothing: activeCharacterClothingStarter
        }
        return newScene
    })

    return newScenes
}
export async function makeScenes(prompt: string, baseInstructions: string, activeCharacterClothingStarter: activeCharacterClothingType): Promise<sceneType[]> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptMakeScenesResponseSchema, "gptMakeScenesResponseSchema"),
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
            activeCharacterClothing: activeCharacterClothingStarter
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
            format: zodTextFormat(gptAlterSceneResponseSchema, "gptSceneResponseSchema"),
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

type sceneBackgroundImageObjType = {
    [key: string]: {
        src: string
    }
}

export async function makeSceneBackgroundImages(prompt: string, projectId: string, scenes: sceneType[], characters: characterType[], activeCharacterClothing: activeCharacterClothingType, domainName: string): Promise<sceneBackgroundImageObjType> {
    console.log(`$prompt`, prompt);
    //what to do
    //prompt that details to base on all scene visuals descriptions...
    //upload character reference images - from found character - clothing...
    //send those files to the api
    //get back all scenes...

    const sceneBackgroundImageObj: sceneBackgroundImageObjType = {}

    function makeReferenceUrls() {
        return characters.map(eachCharacter => {
            const foundClothingId = activeCharacterClothing[eachCharacter.id]
            if (foundClothingId === undefined) throw new Error("not seeing found clothing id")

            const activeClothing = eachCharacter.clothing.find(eachClothingItem => eachClothingItem.id === foundClothingId)
            if (activeClothing === undefined) throw new Error("not seeing activeClothing")

            return `\n${domainName}/api/characters/images/download?characterId=${eachCharacter.id}&src=${activeClothing.file.src}`
        }).join("")
    }

    const baseInstructions = `condense this prompt:${prompt} into an incredibly detailed appearance prompt for gpt image generation for each scene. keep the character reference urls unchanged\ncharacter reference urls:\n${makeReferenceUrls()}`;

    //refine prompt to ensure it fits
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptCondensePromptResponseSchema, "gptCondensePromptResponse"),
        },
    });
    const seenGptCondensePromptResponse = gptCondensePromptResponseSchema.parse(response.output_parsed);
    const condensedPrompt = seenGptCondensePromptResponse.prompt;
    console.log(`$condensedPrompt`, condensedPrompt);

    //generate images for all scenes
    const result = await openai.images.generate({
        model: "dall-e-3",
        prompt: condensedPrompt,
        n: scenes.length
    });

    console.log(`$result`, JSON.stringify(result));
    if (!result.data?.length) return sceneBackgroundImageObj;

    // Create images dir
    const mainDirectory = path.join(uploadedDataDir, projectsDirName, projectId, imagesDirName);
    await ensureDirectoryExists(mainDirectory);

    await Promise.all(result.data.map(async (eachResultData, eachResultDataIndex) => {
        const eachScene = scenes[eachResultDataIndex]

        const imageName = `${eachScene.id}___${uuidV4()}.png`;
        const documentPath = path.join(mainDirectory, imageName);

        if (eachResultData.b64_json) {
            // If base64 is returned
            const image_bytes = Buffer.from(eachResultData.b64_json, "base64");
            await fs.writeFile(documentPath, image_bytes);

        } else if (eachResultData.url) {
            // If URL is returned
            const res = await fetch(eachResultData.url);
            const buffer = Buffer.from(await res.arrayBuffer());
            await fs.writeFile(documentPath, buffer);
        }

        //add onto obj
        sceneBackgroundImageObj[eachScene.id] = {
            src: imageName
        }
    }))

    return sceneBackgroundImageObj
}

export async function makeDialogue(prompt: string, baseInstructions: string): Promise<dialogueType[]> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptMakeDialogueResponseSchema, "gptMakeDialogueResponseSchema"),
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
            format: zodTextFormat(gptNewCharacterResponseSchema, "gptNewCharacterResponseSchema"),
        },
    });

    const seenGptNewCharacterResponse = gptNewCharacterResponseSchema.parse(response.output_parsed)

    //add on required fields
    const newCharacter: newCharacterType = {
        ...seenGptNewCharacterResponse.newCharacter,
        userId: "DummyData",
        voiceId: "",
        clothing: [],
    }

    return newCharacter
}