import path from "path";
import { ensureDirectoryExists } from "@/utility/manageFiles";
import { audioDirName, charactersDirName, imagesDirName, locationsDirName, projectsDirName, uploadedDataDir } from "@/lib/dirPaths";
import { characterToProjectType, gptApiFunctionCallOptionsSchema, locationToProjectType, locationType, makeDialogueAudioBodySchema, makeDialogueAudioBodyType, makeDialogueAudioResponseType, makeSceneBackgroundImageBodySchema, makeSceneBackgroundImageBodyType, makeSceneBackgroundImageResponseType, viewType } from "@/types";
import fs from "fs/promises";
import fsSync from "fs";
import { openai } from "@/lib/openai";
import { elevenlabs } from "@/lib/elevenlabs";
import { NextResponse } from "next/server";
import { errorZodErrorAsString } from "@/useful/consoleErrorWithToast";
import { toFile } from "openai";

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);

    //get functionOption
    const functionCallOption = gptApiFunctionCallOptionsSchema.parse(searchParams.get("functionCallOption"))

    //get data
    const seenBody = await request.json()

    try {
        if (functionCallOption === "makeSceneBackgroundImage") {
            // const makeSceneBackgroundImagesBody = makeSceneBackgroundImageBodySchema.parse(seenBody)
            return NextResponse.json(await makeSceneBackgroundImage(seenBody))

        } else if (functionCallOption === "makeDialogueAudio") {
            const makeDialogueAudioBody = makeDialogueAudioBodySchema.parse(seenBody)
            return NextResponse.json(await makeDialogueAudio(makeDialogueAudioBody))


        } else throw new Error("functionOption not supported")

    } catch (error) {
        throw new Error(errorZodErrorAsString(error))
    }
}

// async function makeSceneBackgroundImage({ prompt, projectId, scene }: makeSceneBackgroundImageBodyType): Promise<makeSceneBackgroundImageResponseType> {
//     console.log(`$prompt`, prompt);

//     //condense prompt
//     const response = await openai.responses.parse({
//         model: "gpt-5-mini",
//         input: prompt,
//         text: {
//             format: zodTextFormat(gptCondensePromptResponseSchema, "gptCondensePromptResponse"),
//         },
//     });
//     const gptCondensePromptResponse = gptCondensePromptResponseSchema.parse(response.output_parsed)

//     const condensedPrompt = gptCondensePromptResponse.prompt
//     console.log(`$condensedPrompt`, condensedPrompt);

//     //generate image for scene
//     const result = await openai.images.generate({
//         model: "gpt-image-1",
//         prompt: condensedPrompt,
//         moderation: "low",
//     });
//     if (result.data === undefined || result.data.length < 1) throw new Error("not seeing result data");

//     // Create images dir
//     const mainDirectory = path.join(uploadedDataDir, projectsDirName, projectId, imagesDirName);
//     await ensureDirectoryExists(mainDirectory);

//     const imageName = `${scene.id}___${uuidV4()}.png`;
//     const documentPath = path.join(mainDirectory, imageName);

//     // If base64 is returned
//     if (result.data[0].b64_json === undefined) throw new Error("not seing image b64")
//     const image_bytes = Buffer.from(result.data[0].b64_json, "base64");
//     await fs.writeFile(documentPath, image_bytes);

//     // Return the image src in the response
//     return {
//         src: imageName
//     }
// }
export async function makeSceneBackgroundImage({ prompt, projectId, scene, charactersInProject, locationsInProject }: makeSceneBackgroundImageBodyType): Promise<makeSceneBackgroundImageResponseType> {
    console.log(`$locationsInProject`, JSON.stringify(locationsInProject, null, 2))

    //viewImageInput
    const foundLocation: locationType | undefined = locationsInProject.map((eachLocationInProject: locationToProjectType) => {
        if (eachLocationInProject.location === undefined) throw new Error("eachLocationInProject.location is undefined")

        return eachLocationInProject.location
    }).find(eachLocation => eachLocation.id === scene.locationId)
    if (foundLocation === undefined) throw new Error("not seeing foundLocation")

    const foundView: viewType | undefined = foundLocation.views.find(eachView => eachView.id === scene.viewId)
    if (foundView === undefined) throw new Error("not seeing foundView")

    const locationMainDirectory = path.join(uploadedDataDir, locationsDirName, foundLocation.id, imagesDirName);
    await ensureDirectoryExists(locationMainDirectory);

    //get view image path
    const locationViewDocumentPath = path.join(locationMainDirectory, foundView.file.src); //view file src
    const locationImageFile = await toFile(fsSync.createReadStream(locationViewDocumentPath), null, {
        type: "image/png",
    })




    //characterImageInputs for characters used in this scene
    const characterImageFiles = await Promise.all(
        charactersInProject.filter(eachCharacterInProject => {
            const foundInDialogue = scene.dialogue.find(eachDialogue => eachDialogue.characterId === eachCharacterInProject.characterId) !== undefined

            return foundInDialogue

        }).map(async (eachCharacterInProject: characterToProjectType) => {
            if (eachCharacterInProject.character === undefined) throw new Error("not seeing eachCharacterInProject.character")

            const foundAppearance = eachCharacterInProject.character.appearances.find(eachAppearance => eachAppearance.id === eachCharacterInProject.activeAppearanceId)
            if (foundAppearance === undefined) throw new Error("not seeing foundAppearance")

            //get folder
            const mainDirectory = path.join(uploadedDataDir, charactersDirName, eachCharacterInProject.characterId, imagesDirName);
            await ensureDirectoryExists(mainDirectory);

            //convert the file to b64
            const documentPath = path.join(mainDirectory, foundAppearance.file.src);

            return await toFile(fsSync.createReadStream(documentPath), null, {
                type: "image/png",
            })
        }))

    console.log(`$characterImageFiles[0]`, characterImageFiles[0].name);
    console.log(`$locationImageFile`, locationImageFile.name);

    const response = await openai.images.edit({
        model: "gpt-image-1",
        image: [locationImageFile, ...characterImageFiles],
        prompt,
    });

    if (response.data === undefined) throw new Error("")

    //get folder
    const mainDirectory = path.join(uploadedDataDir, projectsDirName, projectId, imagesDirName);
    await ensureDirectoryExists(mainDirectory);

    //set the image name
    const imageName = `${scene.id}.png`;
    const documentPath = path.join(mainDirectory, imageName);

    //get the base 64 data
    const imageBase64 = response.data[0].b64_json;
    if (imageBase64 === undefined) throw new Error("not seeing imageBase64")

    //save the file
    const image_bytes = Buffer.from(imageBase64, "base64");
    await fs.writeFile(documentPath, image_bytes);

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