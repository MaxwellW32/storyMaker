"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptNewCharacterResponseSchema, gptMakeScenesResponseSchema, gptStoryResponseSchema, sceneType, gptMakeDialogueResponseSchema, dialogueType, newCharacterType, activeCharacterClothingType } from "@/types";
import { v4 as uuidV4 } from "uuid"

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
            backgroundImageSrc: null,
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
            backgroundImageSrc: null,
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