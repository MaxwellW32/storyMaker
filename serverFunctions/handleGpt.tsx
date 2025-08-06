"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { dialogueType, gptAlterSceneResponseSchema, gptAlterSceneResponseType, gptStoryResponseSchema, gptStoryResponseType, sceneType } from "@/types";
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
        eachScene.dialogue = eachScene.dialogue.map(eachDialogue => {
            //ensure id stays the same
            return addOnToDialogue({ dialogue: eachDialogue })
        })

        //ensure id stays the same
        return addOnToScene({ scene: eachScene })
    })

    return seenGptStoryResponse
}

export async function alterScene(prompt: string, baseInstructions: string, scene: sceneType, referenceScenes: sceneType[]): Promise<gptAlterSceneResponseType> {
    const input = `${prompt}
please use the prompt above to alter the current scene ${JSON.stringify(scene)}.

${referenceScenes.length > 0 ? `you can use these scenes as continuity reference context if needed ${JSON.stringify(referenceScenes)}` : ""}`

    const response = await openai.responses.parse({
        model: "gpt-4.1",
        instructions: baseInstructions,
        input: input,
        text: {
            format: zodTextFormat(gptAlterSceneResponseSchema, "gptAlterSceneResponse"),
        },
    });

    // logJSON("scenes log", response)
    // console.log(response.output_text);

    // const response = await client.responses.create({
    //     prompt: {
    //         "id": "pmpt_68798eb3bc348196a69ae2cfc5b3f9c90b3b26c268ad9b89",
    //         "version": "1"
    //     }
    // });

    //keep same id
    const seenGptAlterSceneResponse = gptAlterSceneResponseSchema.parse(response.output_parsed)
    seenGptAlterSceneResponse.scene = addOnToScene({ scene: seenGptAlterSceneResponse.scene, sceneId: scene.id })

    seenGptAlterSceneResponse.scene.dialogue = seenGptAlterSceneResponse.scene.dialogue.map(eachDialogue => {
        //ensure id stays the same
        return addOnToDialogue({ dialogue: eachDialogue, dialogueId: eachDialogue.id })
    })

    return seenGptAlterSceneResponse
}

function addOnToScene({ scene, sceneId }: { scene: sceneType, sceneId?: sceneType["id"] }) {
    scene.id = sceneId !== undefined ? sceneId : uuidV4()

    return scene
}

function addOnToDialogue({ dialogue, dialogueId }: { dialogue: dialogueType, dialogueId?: dialogueType["id"] }) {
    dialogue.id = dialogueId !== undefined ? dialogueId : uuidV4()

    return dialogue
}