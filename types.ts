import { z } from "zod";
import * as schema from "@/db/schema"
import { unknown } from "zod/v4";

export const dateSchma = z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return new Date(val);
    return val;
}, z.date())

export const textFileApiResponseSchema = z.object({
    fileContent: z.string(),
})
export type textFileApiResponseType = z.infer<typeof textFileApiResponseSchema>

export type schemaType = typeof schema
export type tableNames = keyof schemaType



export const activeAppearanceObjSchema = z.lazy(() => z.record(characterSchema.shape.id, appearanceSchema.shape.id)) //each maps character id to a specific appearance id in that scene
export type activeAppearanceObjType = z.infer<typeof activeAppearanceObjSchema>

export const dialogueSchema = z.object({
    id: z.string().min(1),
    characterId: z.string().min(1),
    sentence: z.string(),
    emotions: z.lazy(() => emotionSchema.shape.type.nullable())
})
export type dialogueType = z.infer<typeof dialogueSchema>

export const sceneOldSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    dialogue: dialogueSchema.array(),
    backgroundImageSrc: z.string(),
    activeAppearanceObj: activeAppearanceObjSchema,
    visualInstructions: z.string().min(1, "add visual instructions to the scene"),
})
export type sceneOldType = z.infer<typeof sceneOldSchema>

export const sceneSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    dialogue: dialogueSchema.array(),
    backgroundImageSrc: z.string(),
    activeAppearanceObj: activeAppearanceObjSchema,
    visualInstructions: z.string().min(1, "add visual instructions to the scene"),
    locationId: z.lazy(() => locationSchema.shape.id),
    viewId: z.lazy(() => viewScehema.shape.id),
})
export type sceneType = z.infer<typeof sceneSchema>

export const sceneForGptSchema = sceneSchema.omit({
    id: true,
    backgroundImageSrc: true,
    activeAppearanceObj: true,
})
export type sceneForGptType = z.infer<typeof sceneForGptSchema>




export const gptStoryResponseSchema = z.object({
    scenes: sceneForGptSchema.array(),
})
export type gptStoryResponseType = z.infer<typeof gptStoryResponseSchema>

export const gptAlterSceneResponseSchema = z.object({
    scene: sceneForGptSchema
})
export type gptAlterSceneResponseType = z.infer<typeof gptAlterSceneResponseSchema>

export const gptMakeScenesResponseSchema = z.object({
    scenes: sceneForGptSchema.array()
})
export type gptMakeScenesResponseType = z.infer<typeof gptMakeScenesResponseSchema>

export const gptMakeDialogueResponseSchema = z.object({
    dialogue: dialogueSchema.array()
})
export type gptMakeDialogueResponseType = z.infer<typeof gptMakeDialogueResponseSchema>

export const gptNewCharacterResponseSchema = z.object({
    newCharacter: z.lazy(() => newCharacterSchema.omit({
        userId: true,
        voiceId: true,
        appearances: true,
    })),
})
export type gptNewCharacterResponseType = z.infer<typeof gptNewCharacterResponseSchema>

export const gptCondensePromptResponseSchema = z.object({
    prompt: z.string().min(1).max(4000)
})
export type gptCondensePromptResponseType = z.infer<typeof gptCondensePromptResponseSchema>

export const gptAppearancesStarterSchema = z.object({
    appearanceStarters: z.lazy(() => appearanceSchema.omit({ id: true, file: true, uploadedFrom: true }).array())
})
export type gptAppearancesStarterType = z.infer<typeof gptAppearancesStarterSchema>

export const gptViewsStarterSchema = z.object({
    viewStarters: z.lazy(() => viewScehema.omit({ id: true, file: true }).array())
})
export type gptViewsStarterType = z.infer<typeof gptViewsStarterSchema>

export const gptPromptInstructionsObjSchema = z.object({
    baseInstructions: z.string().min(1),
    prompt: z.string().min(1),
    loading: z.boolean(),
})
export type gptPromptInstructionsObjType = z.infer<typeof gptPromptInstructionsObjSchema>

export const gptImagePromptInstructionsObjSchema = z.object({
    prompt: z.string().min(1),
    loading: z.boolean(),
    imageSrc: z.string().min(1),
    mode: z.enum(["edit", "make"]),
    formData: z.instanceof(FormData).optional(),
})
export type gptImagePromptInstructionsObjType = z.infer<typeof gptImagePromptInstructionsObjSchema>

export type gptImagePromptInstructionsOuterObj = {
    [key: string]: gptImagePromptInstructionsObjType
}




//gpt api function - for concurrent multi use
export const gptApiFunctionCallOptionsSchema = z.enum(["makeSceneBackgroundImage", "makeDialogueAudio", "makeTempImage"])
export type gptApiFunctionCallOptionsType = z.infer<typeof gptApiFunctionCallOptionsSchema>

export const makeSceneBackgroundImageBodySchema = z.object({
    prompt: z.string().min(1),
    projectId: z.lazy(() => projectSchema.shape.id),
    scene: sceneSchema,
    charactersInProject: z.lazy(() => characterToProjectSchema.passthrough().array()),
    locationsInProject: z.lazy(() => locationToProjectSchema.passthrough().array()),
})
export type makeSceneBackgroundImageBodyType = z.infer<typeof makeSceneBackgroundImageBodySchema>

export const makeSceneBackgroundImageResponseSchema = z.object({
    src: z.string().min(1)
})
export type makeSceneBackgroundImageResponseType = z.infer<typeof makeSceneBackgroundImageResponseSchema>

export const makeTempImageBodySchema = z.object({
    prompt: z.string().min(1),
    formData: z.instanceof(FormData).optional(),
})
export type makeTempImageBodyType = z.infer<typeof makeTempImageBodySchema>

export const makeTempImageResponseSchema = z.object({
    src: z.string().min(1)
})
export type makeTempImageResponseType = z.infer<typeof makeTempImageResponseSchema>

export const makeDialogueAudioBodySchema = z.object({
    line: z.string().min(1),
    projectId: z.lazy(() => projectSchema.shape.id),
    dialogueId: z.lazy(() => dialogueSchema.shape.id),
    variationIndex: z.number(),
    character: z.lazy(() => characterSchema),
})
export type makeDialogueAudioBodyType = z.infer<typeof makeDialogueAudioBodySchema>

export const makeDialogueAudioResponseSchema = z.object({
    dialogueAudioFileName: z.string().min(1)
})
export type makeDialogueAudioResponseType = z.infer<typeof makeDialogueAudioResponseSchema>




export const alterScenesObjSchema = z.record(z.string(), z.object({
    prompt: z.string().min(1, "prompt needs to be present to change scene"),
    baseInstructions: z.string().min(1, "base instructions needs to be present to change scene"),
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
    audioEditable: z.boolean(),
}))
export type alterDialogueObjType = z.infer<typeof alterDialogueObjSchema>

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

export const projectResourceDirOptions = ["audio", "images"] as const
export type projectResourceDirOptionsType = typeof projectResourceDirOptions[number]

export const dbFileCategorySchema = z.enum(["image", "other"])
export type dbFileCategoryType = z.infer<typeof dbFileCategorySchema>

export const dbFileSchema = z.object({
    createdAt: dateSchma,
    fileName: z.string().min(1),
    src: z.string().min(1),
    status: z.enum(["to-delete", "to-upload", "uploaded"]),
    uploadedAlready: z.boolean(),
    fileCategory: dbFileCategorySchema,
})
export type dbFileType = z.infer<typeof dbFileSchema>

export type dbWithFileType = {
    file: dbFileType;
} & Record<string, unknown>;


export const uploadFileApiResponseSchema = z.object({
    names: z.string().array(),
})
export type uploadFileApiResponseType = z.infer<typeof uploadFileApiResponseSchema>




export const downloadProjectBodySchema = z.object({
    projectId: z.lazy(() => projectSchema.shape.id)
})
export type downloadProjectBodyType = z.infer<typeof downloadProjectBodySchema>

export const downloadProjectResponseSchema = z.object({
    names: z.string().array(),
})
export type downloadProjectResponseType = z.infer<typeof downloadProjectResponseSchema>


















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
    scenes: sceneSchema.array(),
    prompt: z.string().min(1, "please enter your story prompt"),
    baseInstructions: z.string().min(1, "please enter base instructions"),
    alterScenesObj: alterScenesObjSchema,
    alterDialogueObj: alterDialogueObjSchema,
    artStyle: z.string().min(1, "please enter your art style"),
    activeLocationId: z.string(),

    //null

    //regular
    name: z.string().min(1),
    userId: z.string().min(1),
})
export type projectType = z.infer<typeof projectSchema> & {
    fromUser?: userType,
    charactersToProjects?: characterToProjectType[],
    locationsToProjects?: locationToProjectType[],
}

export const newProjectSchema = projectSchema.omit({ id: true, dateCreated: true, prompt: true, baseInstructions: true, scenes: true, alterScenesObj: true, alterDialogueObj: true, artStyle: true, activeLocationId: true })
export type newProjectType = z.infer<typeof newProjectSchema>

export const updateProjectSchema = projectSchema.omit({ id: true, dateCreated: true, userId: true })
export type updateProjectType = z.infer<typeof updateProjectSchema>




export const appearanceSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    file: dbFileSchema, //reference image
    uploadedFrom: z.enum(["main", "project"]), //use eventually
})
export type appearanceType = z.infer<typeof appearanceSchema>

export const characterSchema = z.object({
    id: z.string().min(1),

    name: z.string().min(1),
    age: z.number(),
    userId: z.string().min(1),
    voiceId: z.string().min(1, "please provide a voice id from eleven labs"),
    appearances: appearanceSchema.array().min(1, "please add character appearance"),
    personality: z.string().min(1),
    toneOfVoice: z.string(),
    dialogueStyle: z.string(),
    alignment: z.string(),
    goal: z.string(),
    fear: z.string(),
    fatalFlaw: z.string(),
    backstory: z.string(),
    occupation: z.string(),
    location: z.string(),
    archetype: z.string(),
})
export type characterType = z.infer<typeof characterSchema> & {
    fromUser?: userType
    charactersToEmotions?: characterToEmotionType[],
    charactersToTags?: characterToTagType[],
    charactersToProjects?: characterToProjectType[],
    locationsToProjects?: locationToProjectType[],
}

export const newCharacterSchema = characterSchema.omit({ id: true })
export type newCharacterType = z.infer<typeof newCharacterSchema>

export const updateCharacterSchema = characterSchema.omit({ id: true })
export type updateCharacterType = z.infer<typeof updateCharacterSchema>




export const viewScehema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    locationVariationName: z.string().min(1, "enter location vriation e.g summer house, winter"),
    file: dbFileSchema, //reference image,
    description: z.string().min(1),
})
export type viewType = z.infer<typeof viewScehema>


export const locationSchema = z.object({
    id: z.string().min(1),

    userId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    views: viewScehema.array().min(1, "please add a view for the location"),
})
export type locationType = z.infer<typeof locationSchema> & {
    fromUser?: userType
}

export const newLocationSchema = locationSchema.omit({ id: true })
export type newLocationType = z.infer<typeof newLocationSchema>

export const updateLocationSchema = locationSchema.omit({ id: true, userId: true })
export type updateLocationType = z.infer<typeof updateLocationSchema>




export const emotionSchema = z.object({
    type: z.string().min(1),
})
export type emotionType = z.infer<typeof emotionSchema> & {
    charactersToEmotions?: characterToEmotionType[],
}

export const newEmotionSchema = emotionSchema.omit({})
export type newEmotionType = z.infer<typeof newEmotionSchema>

export const updateEmotionSchema = emotionSchema.omit({})
export type updateEmotionType = z.infer<typeof updateEmotionSchema>




export const tagSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
})
export type tagType = z.infer<typeof tagSchema> & {
    charactersToTags?: characterToTagType[],
}

export const newTagSchema = tagSchema.omit({ id: true })
export type newTagType = z.infer<typeof newTagSchema>

export const updateTagSchema = tagSchema.omit({ id: true })
export type updateTagType = z.infer<typeof updateTagSchema>




export const characterToEmotionSchema = z.object({
    simpleId: z.string().min(1),

    characterId: characterSchema.shape.id,
    emotionType: emotionSchema.shape.type,
})
export type characterToEmotionType = z.infer<typeof characterToEmotionSchema> & {
    character?: characterType,
    emotion?: emotionType,
}

export const newCharacterToEmotionSchema = characterToEmotionSchema.omit({ simpleId: true })
export type newCharacterToEmotionType = z.infer<typeof newCharacterToEmotionSchema>

export const updateCharacterToEmotionSchema = characterToEmotionSchema.omit({ simpleId: true, characterId: true, emotionType: true })
export type updateCharacterToEmotionType = z.infer<typeof updateCharacterToEmotionSchema>




export const characterToTagSchema = z.object({
    simpleId: z.string().min(1),

    characterId: characterSchema.shape.id,
    tagId: tagSchema.shape.id,
})
export type characterToTagType = z.infer<typeof characterToTagSchema> & {
    character?: characterType,
    tag?: tagType,
}

export const newCharacterToTagSchema = characterToTagSchema.omit({ simpleId: true })
export type newCharacterToTagType = z.infer<typeof newCharacterToTagSchema>

export const updateCharacterToTagSchema = characterToTagSchema.omit({ simpleId: true, characterId: true, tagId: true })
export type updateCharacterToTagType = z.infer<typeof updateCharacterToTagSchema>




export const characterToProjectSchema = z.object({
    simpleId: z.string().min(1),

    characterId: characterSchema.shape.id,
    projectId: projectSchema.shape.id,
    activeAppearanceId: appearanceSchema.shape.id,//maps to an active appearance id
})
export type characterToProjectType = z.infer<typeof characterToProjectSchema> & {
    character?: characterType,
    project?: projectType,
}

export const newCharacterToProjectSchema = characterToProjectSchema.omit({ simpleId: true })
export type newCharacterToProjectType = z.infer<typeof newCharacterToProjectSchema>

export const updateCharacterToProjectSchema = characterToProjectSchema.omit({ simpleId: true, characterId: true, projectId: true })
export type updateCharacterToProjectType = z.infer<typeof updateCharacterToProjectSchema>




export const locationToProjectSchema = z.object({
    simpleId: z.string().min(1),

    locationId: locationSchema.shape.id,
    projectId: projectSchema.shape.id,
    activeViewId: viewScehema.shape.id,
})
export type locationToProjectType = z.infer<typeof locationToProjectSchema> & {
    location?: locationType,
    project?: projectType,
}

export const newLocationToProjectSchema = locationToProjectSchema.omit({ simpleId: true })
export type newLocationToProjectType = z.infer<typeof newLocationToProjectSchema>

export const updateLocationToProjectSchema = locationToProjectSchema.omit({ simpleId: true, locationId: true, projectId: true })
export type updateLocationToProjectType = z.infer<typeof updateLocationToProjectSchema>