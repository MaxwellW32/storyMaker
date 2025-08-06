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

export async function POST(request: Request) {
    const seenAudioBody = makeAudioBodySchema.parse(await request.json())

    const elevenlabs = new ElevenLabsClient({
        apiKey: apiKey
    });

    const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
        text: seenAudioBody.text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });

    //write the audio to the server
    const dirPath = path.join(projectAudioDir, seenAudioBody.projectId)
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

    const audioFileName = `audio_${uudiv4()}.mp3`
    const filePath = path.join(dirPath, audioFileName)

    await fs.writeFile(filePath, buffer)

    // Return the image file in the response
    const newAudioResponse: makeAudioResponseType = {
        filePath: filePath
    }
    makeAudioResponseSchema.parse(newAudioResponse)

    return NextResponse.json(newAudioResponse)
}