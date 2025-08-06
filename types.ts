import { z } from "zod";

export const dateSchma = z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return new Date(val);
    return val;
}, z.date())

export const textFileApiResponseSchema = z.object({
    fileContent: z.string(),
})
export type textFileApiResponseType = z.infer<typeof textFileApiResponseSchema>

//refresh db on change
export const typeEmotionsOptions = ["excited", "happy"] as const
export const typeEmotionsSchema = z.enum(typeEmotionsOptions)
export type typeEmotionsType = z.infer<typeof typeEmotionsSchema>

export const dialogueSchema = z.object({
    id: z.string().min(1),
    characterId: z.string().min(1),
    sentence: z.string(),
    emotions: typeEmotionsSchema.nullable(),
})
export type dialogueType = z.infer<typeof dialogueSchema>

export const sceneSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    dialogue: dialogueSchema.array(),
    backgroundImageSrc: z.string().min(1).nullable(),
})
export type sceneType = z.infer<typeof sceneSchema>

export const gptStoryResponseSchema = z.object({
    scenes: sceneSchema.array(),
})
export type gptStoryResponseType = z.infer<typeof gptStoryResponseSchema>

export const gptAlterSceneResponseSchema = z.object({
    scene: sceneSchema
})
export type gptAlterSceneResponseType = z.infer<typeof gptAlterSceneResponseSchema>

export const alterScenesObjSchema = z.record(z.string(), z.object({
    prompt: z.string().min(1, "prompt needs to be present to change scene"),
    loading: z.boolean(),
    referencedScenes: z.string(),
    variationIndex: z.number(),
    variations: sceneSchema.array()
}))
export type alterScenesObjType = z.infer<typeof alterScenesObjSchema>

export const alterDialogueObjSchema = z.record(z.string(), z.object({
    audioFileNameArray: z.string().min(1).array(),
    variationIndex: z.number(),
    loading: z.boolean(),
}))
export type alterDialogueObjType = z.infer<typeof alterDialogueObjSchema>

export type projectFilterType = {
    [key in keyof projectType]?: projectType[key]
}
export type allFilterType = projectFilterType

//handle search component with limits/offsets
export type searchObjType<T> = {
    searchItems: T[],
    loading?: true,
    limit?: number, //how many
    offset?: number, //increaser
    incrementOffsetBy?: number, //how much to increase by
    refreshAll?: boolean
}

export type tableFilterTypes<T> = {
    [key in keyof T]?: T[key]
}

export type withId = {
    id: string | number;
} & Record<string, unknown>

export const makeAudioBodySchema = z.object({
    line: z.string().min(1),
    projectId: z.lazy(() => projectSchema.shape.id),
    dialogueId: z.lazy(() => dialogueSchema.shape.id),
    character: z.lazy(() => characterSchema),
})
export type makeAudioBodyType = z.infer<typeof makeAudioBodySchema>

export const makeAudioResponseSchema = z.object({
    dialogueAudioFileName: z.string().min(1)
})
export type makeAudioResponseType = z.infer<typeof makeAudioResponseSchema>

export const projectResourceDirOptions = ["audio", "images"] as const
export type projectResourceDirOptionsType = typeof projectResourceDirOptions[number]

export type writeFileOptions =
    {
        type: "text",
        text: string,
    } | {
        type: "audio",
        audioFile: ReadableStream<Uint8Array<ArrayBufferLike>>,

    } | {
        type: "image",
        imageFile: string,
    }



















export const userSchema = z.object({
    //defaults
    id: z.string().min(1),

    //null
    name: z.string().min(1).nullable(),
    email: z.string().email().nullable(),
    emailVerified: dateSchma.nullable(),
    image: z.string().min(1).nullable(),

    //regular
})
export type userType = z.infer<typeof userSchema> & {
    projects?: projectType[],
}

export const newUserSchema = userSchema.omit({ id: true })
export type newUserType = z.infer<typeof newUserSchema>

export const updateUserSchema = userSchema.omit({ id: true })
export type updateUserType = z.infer<typeof updateUserSchema>




export const projectSchema = z.object({
    //defaults
    id: z.string().min(1),
    dateCreated: dateSchma,
    prompt: z.string().min(1),
    scenes: sceneSchema.array(),
    alterScenesObj: alterScenesObjSchema,
    alterDialogueObj: alterDialogueObjSchema,

    //null

    //regular
    name: z.string().min(1),
    userId: z.string().min(1),
})
export type projectType = z.infer<typeof projectSchema> & {
    charactersToProjects?: characterToProjectType[],
    fromUser?: userType
}

export const newProjectSchema = projectSchema.omit({ id: true, dateCreated: true, prompt: true, scenes: true, alterScenesObj: true, alterDialogueObj: true })
export type newProjectType = z.infer<typeof newProjectSchema>

export const updateProjectSchema = projectSchema.omit({ id: true, dateCreated: true, userId: true })
export type updateProjectType = z.infer<typeof updateProjectSchema>




export const characterSchema = z.object({
    id: z.string().min(1),

    name: z.string().min(1),
    age: z.number(),
    userId: z.string().min(1),
    voiceId: z.string().min(1, "please provide a voice id from eleven labs"),
})
export type characterType = z.infer<typeof characterSchema> & {
    charactersToProjects?: characterToProjectType[],
    charactersToEmotions?: characterToEmotionType[],
    fromUser?: userType
}

export const newCharacterSchema = characterSchema.omit({ id: true })
export type newCharacterType = z.infer<typeof newCharacterSchema>

export const updateCharacterSchema = characterSchema.omit({ id: true })
export type updateCharacterType = z.infer<typeof updateCharacterSchema>




export const emotionSchema = z.object({
    type: typeEmotionsSchema,
})
export type emotionType = z.infer<typeof emotionSchema> & {
    charactersToEmotions?: characterToEmotionType[],
}




export const characterToEmotionSchema = z.object({
    id: z.string().min(1),

    characterId: characterSchema.shape.id,
    emotionType: typeEmotionsSchema,
})
export type characterToEmotionType = z.infer<typeof characterToEmotionSchema> & {
    character?: characterType,
    emotion?: emotionType,
}




export const characterToProjectSchema = z.object({
    id: z.string().min(1),

    projectId: projectSchema.shape.id,
    characterId: characterSchema.shape.id,
})
export type characterToProjectType = z.infer<typeof characterToProjectSchema> & {
    character?: characterType,
    project?: projectType,
}

export const newCharacterToProjectSchema = characterToProjectSchema.omit({ id: true })
export type newCharacterToProjectType = z.infer<typeof newCharacterToProjectSchema>

export const updateCharacterToProjectSchema = characterToProjectSchema.omit({ id: true })
export type updateCharacterToProjectType = z.infer<typeof updateCharacterToProjectSchema>