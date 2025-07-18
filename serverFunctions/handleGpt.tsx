"use server"
import OpenAI from "openai";
import dotenv from 'dotenv';
import { zodTextFormat } from "openai/helpers/zod";
import { gptAlterSceneResponseSchema, gptAlterSceneResponseType, gptStoryResponseSchema, gptStoryResponseType, sceneType } from "@/types";

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

    // logJSON("scenes log", response)
    // console.log(response.output_text);

    // const response = await client.responses.create({
    //     prompt: {
    //         "id": "pmpt_68798eb3bc348196a69ae2cfc5b3f9c90b3b26c268ad9b89",
    //         "version": "1"
    //     }
    // });

    return gptStoryResponseSchema.parse(response.output_parsed)
}

export async function alterScene(prompt: string, baseInstructions: string, scene: sceneType, referenceScenes: sceneType[]): Promise<gptAlterSceneResponseType> {
    const input = `${prompt}
please use the prompt to alter the current scene ${JSON.stringify(scene)}, 

${referenceScenes.length > 0 ? `you can use these scenes as continuity reference context if needed ${JSON.stringify(referenceScenes)}` : ""}`

    console.log(`$input`, input);

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

    return gptAlterSceneResponseSchema.parse(response.output_parsed)
}