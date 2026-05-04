import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config({ path: ".env.local" });

const apiKey = process.env.OPEN_API_KEY
export const openai = new OpenAI({
    apiKey: apiKey
});