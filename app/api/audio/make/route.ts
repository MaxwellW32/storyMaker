import { makeAudioBodySchema, makeAudioResponseSchema, makeAudioResponseType } from "@/types";
import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { ensureDirectoryExists } from "@/utility/manageFiles";
import path from "path";
import { projectAudioDir } from "@/lib/dirPaths";
import { v4 as uudiv4 } from "uuid"
import fs from "fs/promises";
import { NextResponse } from "next/server";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.ELEVENLABS_API_KEY

const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey
});

export async function POST(request: Request) {
    const seenMakeAudioBody = makeAudioBodySchema.parse(await request.json())

    const audio = await elevenlabs.textToSpeech.convert(seenMakeAudioBody.character.voiceId, {
        text: seenMakeAudioBody.line,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });

    //write the audio to the server
    const dirPath = path.join(projectAudioDir, seenMakeAudioBody.projectId)
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

    const audioFileName = `${seenMakeAudioBody.dialogueId}____${uudiv4()}.mp3`
    const audioFilePath = path.join(dirPath, audioFileName)

    await fs.writeFile(audioFilePath, buffer)

    // Return the image file in the response
    const newAudioResponse: makeAudioResponseType = {
        dialogueAudioFileName: audioFileName
    }
    makeAudioResponseSchema.parse(newAudioResponse)

    return NextResponse.json(newAudioResponse)
}