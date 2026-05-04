import dotenv from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

dotenv.config({ path: ".env.local" });

const apiKey = process.env.ELEVENLABS_API_KEY
export const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey
});