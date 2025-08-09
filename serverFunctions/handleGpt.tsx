"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptAlterSceneResponseType, gptNewCharacterResponseSchema, gptNewCharacterResponseType, gptMakeScenesResponseSchema, gptMakeScenesResponseType, gptStoryResponseSchema, gptStoryResponseType, sceneType, gptMakeDialogueResponseSchema, gptMakeDialogueResponseType } from "@/types";
import { v4 as uuidV4 } from "uuid"

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPEN_API_KEY

const openai = new OpenAI({
    apiKey: apiKey
});

export async function makeStory(prompt: string, baseInstructions: string): Promise<gptStoryResponseType> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptStoryResponseSchema, "gptStoryResponse"),
        },
    });

    const seenGptStoryResponse = gptStoryResponseSchema.parse(response.output_parsed)
    seenGptStoryResponse.scenes = seenGptStoryResponse.scenes.map(eachScene => {
        //ensure proper id
        eachScene.id = uuidV4()

        //assign new ids to dialogue
        eachScene.dialogue = eachScene.dialogue.map(eachDialogue => {
            eachDialogue.id = uuidV4()

            return eachDialogue
        })

        return eachScene
    })

    return seenGptStoryResponse
}

export async function makeScenes(prompt: string, baseInstructions: string): Promise<gptMakeScenesResponseType> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptMakeScenesResponseSchema, "gptMakeScenesResponseSchema"),
        },
    });

    const seenGptMakeScenesResponse = gptMakeScenesResponseSchema.parse(response.output_parsed)

    seenGptMakeScenesResponse.scenes = seenGptMakeScenesResponse.scenes.map(eachScene => {
        //make scene id
        eachScene.id = uuidV4()

        //assign new ids to dialogue
        eachScene.dialogue = eachScene.dialogue.map(eachDialogue => {
            eachDialogue.id = uuidV4()

            return eachDialogue
        })

        return eachScene
    })

    return seenGptMakeScenesResponse
}
export async function alterScene(prompt: string, baseInstructions: string, scene: sceneType): Promise<gptAlterSceneResponseType> {
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
    seenGptAlterSceneResponse.scene.id = scene.id

    //assign new ids to dialogue
    seenGptAlterSceneResponse.scene.dialogue = seenGptAlterSceneResponse.scene.dialogue.map(eachDialogue => {
        eachDialogue.id = uuidV4()

        return eachDialogue
    })

    return seenGptAlterSceneResponse
}

export async function makeDialogue(prompt: string, baseInstructions: string): Promise<gptMakeDialogueResponseType> {
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

    return seenGptMakeDialogueResponse
}

export async function makeCharacter(prompt: string, baseInstructions: string): Promise<gptNewCharacterResponseType> {
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: prompt,
        text: {
            format: zodTextFormat(gptNewCharacterResponseSchema, "gptNewCharacterResponseSchema"),
        },
    });

    const seenGptNewCharacterResponse = gptNewCharacterResponseSchema.parse(response.output_parsed)

    return seenGptNewCharacterResponse
}