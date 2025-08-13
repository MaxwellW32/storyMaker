import path from "path";
import { ensureDirectoryExists } from "@/utility/manageFiles";
import { audioDirName, imagesDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";
import { gptApiFunctionCallOptionsSchema, gptCondensePromptResponseSchema, makeDialogueAudioBodySchema, makeDialogueAudioBodyType, makeDialogueAudioResponseType, makeSceneBackgroundImageBodySchema, makeSceneBackgroundImageBodyType, makeSceneBackgroundImageResponseType } from "@/types";
import { zodTextFormat } from "openai/helpers/zod";
import fs from "fs/promises";
import { v4 as uuidV4 } from "uuid"
import { openai } from "@/lib/openai";
import { elevenlabs } from "@/lib/elevenlabs";
import { NextResponse } from "next/server";
import { errorZodErrorAsString } from "@/useful/consoleErrorWithToast";

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);

    //get functionOption
    const functionCallOption = gptApiFunctionCallOptionsSchema.parse(searchParams.get("functionCallOption"))

    //get data
    const seenBody = await request.json()

    try {
        if (functionCallOption === "makeSceneBackgroundImage") {
            const makeSceneBackgroundImagesBody = makeSceneBackgroundImageBodySchema.parse(seenBody)
            return NextResponse.json(await makeSceneBackgroundImage(makeSceneBackgroundImagesBody))

        } else if (functionCallOption === "makeDialogueAudio") {
            const makeDialogueAudioBody = makeDialogueAudioBodySchema.parse(seenBody)
            return NextResponse.json(await makeDialogueAudio(makeDialogueAudioBody))


        } else throw new Error("functionOption not supported")

    } catch (error) {
        throw new Error(errorZodErrorAsString(error))
    }
}

async function makeSceneBackgroundImage({ prompt, projectId, scene }: makeSceneBackgroundImageBodyType): Promise<makeSceneBackgroundImageResponseType> {
    console.log(`$prompt`, prompt);

    //condense prompt
    const response = await openai.responses.parse({
        model: "gpt-4.1",
        input: prompt,
        text: {
            format: zodTextFormat(gptCondensePromptResponseSchema, "gptCondensePromptResponse"),
        },
    });
    const gptCondensePromptResponse = gptCondensePromptResponseSchema.parse(response.output_parsed)

    const condensedPrompt = gptCondensePromptResponse.prompt
    console.log(`$condensedPrompt`, condensedPrompt);

    //generate image for scene
    const result = await openai.images.generate({
        model: "gpt-image-1",
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

    // Return the image src in the response
    return {
        src: imageName
    }
}

async function makeDialogueAudio({ character, line, projectId, dialogueId, variationIndex }: makeDialogueAudioBodyType): Promise<makeDialogueAudioResponseType> {
    const audio = await elevenlabs.textToSpeech.convert(character.voiceId, {
        text: line,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });

    //write the audio to the server
    const dirPath = path.join(uploadedDataDir, projectsDirName, projectId, audioDirName)
    await ensureDirectoryExists(dirPath)

    const stream = audio as ReadableStream;
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);

    const audioFileName = `${dialogueId}__${variationIndex + 1}.mp3`
    const audioFilePath = path.join(dirPath, audioFileName)

    await fs.writeFile(audioFilePath, buffer)

    // Return the image file in the response
    return {
        dialogueAudioFileName: audioFileName
    }
} 