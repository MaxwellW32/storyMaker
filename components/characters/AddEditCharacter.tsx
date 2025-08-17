"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { newCharacterSchema, newCharacterType, characterSchema, characterType, updateCharacterSchema, emotionType, searchObjType, tagType, dbFileType, uploadFileApiResponseSchema, appearanceType, gptImagePromptInstructions, gptPromptInstructionsType } from '@/types'
import toast from 'react-hot-toast'
import { addCharacter, deleteImageForCharacter, updateCharacter } from '@/serverFunctions/handleCharacters'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { addVariablesToString, convertBtyes, deepClone, reduceObj } from '@/utility/utility'
import { getEmotions } from '@/serverFunctions/handleEmotions'
import ViewItems from '../items/ViewItem'
import ViewEmotion from '../emotions/ViewEmotion'
import Search from '../search/Search'
import { addCharacterToEmotion, deleteCharacterToEmotion, getCharacterToEmotions } from '@/serverFunctions/handleCharactersToEmotions'
import ShowMore from '../showMore/ShowMore'
import { getTags } from '@/serverFunctions/handleTags'
import ViewTag from '../tags/ViewTag'
import { addCharacterToTag, deleteCharacterToTag, getCharacterToTags } from '@/serverFunctions/handleCharactersToTags'
import TextArea from '../inputs/textArea/TextArea'
import { makeAppearanceStarters, makeCharacter, makeTempImage } from '@/serverFunctions/handleGpt'
import { handleWithFiles } from '@/utility/handleWithFiles'
import Image from 'next/image'
import { allowedImageFileTypes, imageFileInputAccept, maxBodyToServerSize, maxFileUploadSize } from '@/lib/uploadFilesLib'
import { v4 as uuidV4 } from 'uuid'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'

export default function AddEditCharacter({ sentCharacter, submissionAction }: { sentCharacter?: characterType, submissionAction?: () => void }) {
    const initialFormObj: newCharacterType = {
        name: "",
        age: 20,
        userId: "dummyData",
        voiceId: "",
        appearances: [],
        personality: "",
        toneOfVoice: "",
        dialogueStyle: "",
        alignment: "",
        goal: "",
        fear: "",
        fatalFlaw: "",
        backstory: "",
        occupation: "",
        location: "",
        archetype: "",
    }
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<characterType>>(deepClone(sentCharacter === undefined ? initialFormObj : updateCharacterSchema.parse(sentCharacter)))
    const [formErrors, formErrorsSet] = useState<{ [key: string]: string | undefined }>({})
    // console.log(`$formObj`, formObj);
    const [emotionsSearchObj, emotionsSearchObjSet] = useState<searchObjType<emotionType>>({
        searchItems: [],
    })
    const [chosenEmotionTypes, chosenEmotionTypesSet] = useState<(emotionType["type"])[] | undefined>(undefined)

    const [tagsSearchObj, tagsSearchObjSet] = useState<searchObjType<tagType>>({
        searchItems: [],
    })
    const [chosenTagIds, chosenTagIdsSet] = useState<(tagType["id"])[] | undefined>(undefined)
    const [makeNewCharacterInstructionsObj, makeNewCharacterInstructionsObjSet] = useState<{
        prompt: string,
        baseInstructions: string,
        loading: boolean,
    }>({
        prompt: "",
        baseInstructions: `Create a new fictional character based on the user’s initial concept.  
Fill out each attribute below with rich, specific, and internally consistent details.  
Avoid generic descriptions — make the character unique and memorable.  
Do not include physical appearance details here; those are handled separately.  

personality: // Core temperament, values, and worldview  
toneOfVoice: // How they sound when speaking (intonation, rhythm, formality)  
dialogueStyle: // Word choice, sentence length, recurring phrases, quirks  
alignment: // Moral/ethical compass (can use anything e.g "Lawful Good", "Chaotic Neutral")  
goal: // Main driving force behind their actions  
fear: // Deepest anxiety or dread  
fatalFlaw: // Trait that often causes trouble or conflict  
backstory: // Brief but vivid past experiences that shaped them  
occupation: // Job, trade, or societal role  
location: // Usual setting or habitat  
archetype: // Narrative role (e.g., "The Hero", "The Trickster", "The Mentor")  
`,
        loading: false
    })

    const [appearanceImageInstructionsObj, appearanceImageInstructionsObjSet] = useState<gptImagePromptInstructions>({})
    const [appearanceStarterInstructionsObj, appearanceStarterInstructionsObjSet] = useState<gptPromptInstructionsType>({
        baseInstructions: `Generate a new appearance for the character based on the user’s prompt. Do not mention age directly.

Use the reference character below to stay consistent and to see what's been made already. Each appearance must be highly precise.

Provide:
A short, fitting appearance name.
A detailed but compact physical description (physical, clothing, body, hairstyle, accessories, distinguishing traits). The description will be used for image generation, so accuracy and clarity are more important than length.

character:
[[character]]
`,
        prompt: ``,
        loading: false
    })
    const [imageFormData, imageFormDataSet] = useState<FormData | null>(null)

    //get chosen emotions
    useEffect(() => {
        //ensures we only interact with chosen emotions if deliberate
        if (sentCharacter === undefined || sentCharacter.charactersToEmotions === undefined) return

        chosenEmotionTypesSet(sentCharacter.charactersToEmotions.map(eachCharacterToEmotion => eachCharacterToEmotion.emotionType))

    }, []);

    //get chosen tags
    useEffect(() => {
        //ensures we only interact with chosen emotions if deliberate
        if (sentCharacter === undefined || sentCharacter.charactersToTags === undefined) return

        chosenTagIdsSet(sentCharacter.charactersToTags.map(eachCharacterToTag => eachCharacterToTag.tagId))

    }, []);

    //handle changes from above
    useEffect(() => {
        if (sentCharacter === undefined) return

        formObjSet(deepClone(updateCharacterSchema.parse(sentCharacter)))

    }, [sentCharacter])

    async function handleSubmit() {
        try {
            toast.success("submittting")

            //new character
            if (sentCharacter === undefined) {
                const validatedNewCharacter = newCharacterSchema.parse(formObj)

                //send up to server
                const addedCharacter = await addCharacter(validatedNewCharacter)

                //appearances
                if (addedCharacter.appearances !== undefined) {
                    addedCharacter.appearances = await handleWithFiles(addedCharacter.appearances, imageFormData, {
                        upload: async () => {
                            if (imageFormData === null) throw new Error("imageFormData null")

                            //set formData info
                            imageFormData.append("characterId", addedCharacter.id)

                            const response = await fetch(`/api/characters/images/upload`, {
                                method: 'POST',
                                body: imageFormData,
                            })
                            //get the srcs of files uploaded - confirmation
                            const seenNamesObj = await response.json()

                            //validate
                            const validatedUploadFileApiResponse = uploadFileApiResponseSchema.parse(seenNamesObj)

                            return validatedUploadFileApiResponse
                        },
                        delete: async (dbWithFilesObjs) => {
                            if (sentCharacter !== undefined) {
                                await deleteImageForCharacter(addedCharacter.id, dbWithFilesObjs)
                            }
                        }
                    })

                    //update same character
                    await updateCharacter(addedCharacter.id, { appearances: addedCharacter.appearances })
                }

                //add emotions
                if (chosenEmotionTypes !== undefined) {
                    await Promise.all(chosenEmotionTypes.map(async eachChosenEmotionType => {
                        await addCharacterToEmotion({
                            characterId: addedCharacter.id,
                            emotionType: eachChosenEmotionType
                        })
                    }))
                }

                //add tags
                if (chosenTagIds !== undefined) {
                    await Promise.all(chosenTagIds.map(async eachChosenTagId => {
                        await addCharacterToTag({
                            characterId: addedCharacter.id,
                            tagId: eachChosenTagId
                        })
                    }))
                }

                toast.success("submitted")

                //reset
                chosenEmotionTypesSet(undefined)
                chosenTagIdsSet(undefined)
                imageFormDataSet(null)
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedCharacter = updateCharacterSchema.parse(formObj)

                //appearances
                if (validatedUpdatedCharacter.appearances !== undefined) {
                    validatedUpdatedCharacter.appearances = await handleWithFiles(validatedUpdatedCharacter.appearances, imageFormData, {
                        upload: async () => {
                            if (imageFormData === null) throw new Error("imageFormData null")

                            //set formData info
                            imageFormData.append("characterId", sentCharacter.id)

                            const response = await fetch(`/api/characters/images/upload`, {
                                method: 'POST',
                                body: imageFormData,
                            })
                            //get the srcs of files uploaded - confirmation
                            const seenNamesObj = await response.json()

                            //validate
                            const validatedUploadFileApiResponse = uploadFileApiResponseSchema.parse(seenNamesObj)

                            return validatedUploadFileApiResponse
                        },
                        delete: async (dbWithFilesObjs) => {
                            if (sentCharacter !== undefined) {
                                await deleteImageForCharacter(sentCharacter.id, dbWithFilesObjs)
                            }
                        }
                    })
                }

                //update
                await updateCharacter(sentCharacter.id, validatedUpdatedCharacter)

                if (chosenEmotionTypes !== undefined) {
                    //get whats on server
                    const emotionsForCharacterOnServer = await getCharacterToEmotions({ characterId: sentCharacter.id })

                    //whatever is not seen in local
                    const emotionTypesToAdd: (emotionType["type"])[] = []
                    const emotionTypesToDelete: (emotionType["type"])[] = []

                    //local
                    chosenEmotionTypes.map(eachChosenEmotionType => {
                        const seenInServer = emotionsForCharacterOnServer.find(eachEmotionForCharacterOnServer => eachEmotionForCharacterOnServer.emotionType === eachChosenEmotionType) !== undefined

                        if (!seenInServer) {
                            emotionTypesToAdd.push(eachChosenEmotionType)
                        }
                    })
                    //server
                    emotionsForCharacterOnServer.map(eachEmotionForCharacterOnServer => {
                        const seenInLocal = chosenEmotionTypes.find(eachChosenEmotionType => eachChosenEmotionType === eachEmotionForCharacterOnServer.emotionType) !== undefined

                        if (!seenInLocal) {
                            emotionTypesToDelete.push(eachEmotionForCharacterOnServer.emotionType)
                        }
                    })

                    //add emotions
                    await Promise.all(emotionTypesToAdd.map(async eachEmotionTypeToAdd => {
                        await addCharacterToEmotion({
                            characterId: sentCharacter.id,
                            emotionType: eachEmotionTypeToAdd
                        })
                    }))
                    //delete emotions
                    await Promise.all(emotionTypesToDelete.map(async eachEmotionTypeToDelete => {
                        await deleteCharacterToEmotion({
                            characterId: sentCharacter.id,
                            emotionType: eachEmotionTypeToDelete
                        })
                    }))
                }

                if (chosenTagIds !== undefined) {
                    //get whats on server
                    const tagsForCharacterOnServer = await getCharacterToTags({ characterId: sentCharacter.id })

                    //whatever is not seen in local
                    const tagIdsToAdd: (tagType["id"])[] = []
                    const tagIdsToDelete: (tagType["id"])[] = []

                    //local
                    chosenTagIds.map(eachChosenTagId => {
                        const seenInServer = tagsForCharacterOnServer.find(eachTagForCharacterOnServer => eachTagForCharacterOnServer.tagId === eachChosenTagId) !== undefined

                        if (!seenInServer) {
                            tagIdsToAdd.push(eachChosenTagId)
                        }
                    })
                    //server
                    tagsForCharacterOnServer.map(eachTagForCharacterOnServer => {
                        const seenInLocal = chosenTagIds.find(eachChosenTagId => eachChosenTagId === eachTagForCharacterOnServer.tagId) !== undefined

                        if (!seenInLocal) {
                            tagIdsToDelete.push(eachTagForCharacterOnServer.tagId)
                        }
                    })

                    //add tags
                    await Promise.all(tagIdsToAdd.map(async eachTagIdToAdd => {
                        await addCharacterToTag({
                            characterId: sentCharacter.id,
                            tagId: eachTagIdToAdd
                        })
                    }))
                    //delete tags
                    await Promise.all(tagIdsToDelete.map(async eachTagIdToDelete => {
                        await deleteCharacterToTag({
                            characterId: sentCharacter.id,
                            tagId: eachTagIdToDelete
                        })
                    }))
                }

                //reset
                imageFormDataSet(null)

                toast.success("character updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function checkErrors(seenFormObj: Partial<characterType>, seenName?: keyof characterType) {
        //refresh all - scan all
        if (seenName === undefined) {
            formErrorsSet({})
        }

        //@ts-expect-error type
        const testSchema = seenName !== undefined ? characterSchema.pick({ [seenName]: true }).safeParse(seenFormObj) : characterSchema.partial().safeParse(seenFormObj);

        if (testSchema.success) {
            if (seenName !== undefined) {
                formErrorsSet(prevObj => {
                    const newObj = { ...prevObj }
                    delete newObj[seenName]

                    return newObj
                })
            }

            return false

        } else {
            testSchema.error.issues.map(eachIssue => {
                formErrorsSet(prevObj => {
                    const newObj = { ...prevObj }
                    const seenPath = eachIssue.path.join("/")

                    newObj[seenPath] = eachIssue.message

                    return newObj
                })
            })

            return true
        }
    }

    async function handleGenerateCharacter() {
        try {
            if (makeNewCharacterInstructionsObj.baseInstructions === "") throw new Error("not seeing baseInstructions")
            if (makeNewCharacterInstructionsObj.prompt === "") throw new Error("not seeing prompt")

            //loading
            makeNewCharacterInstructionsObjSet(prevMakeNewCharacterInstructionsObj => {
                const newMakeNewCharacterInstructionsObj = { ...prevMakeNewCharacterInstructionsObj }
                newMakeNewCharacterInstructionsObj.loading = true
                return newMakeNewCharacterInstructionsObj
            })

            toast.success("Generating character...")

            const newCharacter = await makeCharacter(makeNewCharacterInstructionsObj.prompt, makeNewCharacterInstructionsObj.baseInstructions)

            //set new character
            formObjSet({ ...newCharacter })

        } catch (error) {
            consoleAndToastError(error)

        } finally {
            makeNewCharacterInstructionsObjSet(prevMakeNewCharacterInstructionsObj => {
                const newMakeNewCharacterInstructionsObj = { ...prevMakeNewCharacterInstructionsObj }
                newMakeNewCharacterInstructionsObj.loading = false
                return newMakeNewCharacterInstructionsObj
            })
        }
    }

    async function handleGenerateAppearanceStarter() {
        try {
            if (appearanceStarterInstructionsObj.baseInstructions === "") throw new Error("not seeing baseInstructions")
            if (appearanceStarterInstructionsObj.prompt === "") throw new Error("not seeing prompt")

            const seenBaseInstructions = addVariablesToString(appearanceStarterInstructionsObj.baseInstructions, {
                character: reduceObj(formObj, ["name", "age", "appearances", "personality"])
            })
            console.log(`$seenBaseInstructions`, seenBaseInstructions);
            console.log(`$appearanceStarterInstructionsObj.prompt `, appearanceStarterInstructionsObj.prompt);

            //loading
            appearanceStarterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }
                newAppearanceStarterInstructionsObj.loading = true
                return newAppearanceStarterInstructionsObj
            })

            toast.success("making appearance(s)...")

            const makeAppearanceStartersResponse = await makeAppearanceStarters(appearanceStarterInstructionsObj.prompt, seenBaseInstructions)

            const newAppearances: appearanceType[] = makeAppearanceStartersResponse.appearanceStarters.map(eachAppearanceStarter => {
                const newAppearance: appearanceType = {
                    ...eachAppearanceStarter,
                    id: uuidV4(),
                    uploadedFrom: "main",
                    file: {
                        src: "",
                        createdAt: new Date(),
                        fileName: "dummyData",
                        status: "to-upload",
                        uploadedAlready: false,
                        fileCategory: "image"
                    },
                }

                return newAppearance
            })

            //set new appearances
            formObjSet(prevFormObj => {
                const newFormObj = { ...prevFormObj }
                if (newFormObj.appearances === undefined) return prevFormObj

                newFormObj.appearances = [...newFormObj.appearances, ...newAppearances]

                return newFormObj
            })

        } catch (error) {
            consoleAndToastError(error)

        } finally {
            appearanceStarterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }
                newAppearanceStarterInstructionsObj.loading = false
                return newAppearanceStarterInstructionsObj
            })
        }
    }
    async function handleGenerateAppearanceImage(appearance: appearanceType) {
        try {
            const seenAppearanceImageInstructionsObj = appearanceImageInstructionsObj[appearance.id]
            if (seenAppearanceImageInstructionsObj === undefined) throw new Error("not seeing seenAppearanceImageInstructionsObj")

            toast.success("generating image!")

            //set loading
            appearanceImageInstructionsObjSet(prevAppearanceImageInstructionsObj => {
                if (prevAppearanceImageInstructionsObj[appearance.id] === undefined) return prevAppearanceImageInstructionsObj

                //react refresh
                const newAppearanceImageInstructionsObj = { ...prevAppearanceImageInstructionsObj }
                newAppearanceImageInstructionsObj[appearance.id] = { ...newAppearanceImageInstructionsObj[appearance.id] }

                newAppearanceImageInstructionsObj[appearance.id].loading = true

                return newAppearanceImageInstructionsObj
            })

            const finalPromt = addVariablesToString(seenAppearanceImageInstructionsObj.prompt, {
                appearance: appearance
            })
            const makeAppearanceImageResponse = await makeTempImage(finalPromt, seenAppearanceImageInstructionsObj.formData)

            //update src
            appearanceImageInstructionsObjSet(prevAppearanceImageInstructionsObj => {
                if (prevAppearanceImageInstructionsObj[appearance.id] === undefined) return prevAppearanceImageInstructionsObj

                //react refresh
                const newAppearanceImageInstructionsObj = { ...prevAppearanceImageInstructionsObj }
                newAppearanceImageInstructionsObj[appearance.id] = { ...newAppearanceImageInstructionsObj[appearance.id] }

                newAppearanceImageInstructionsObj[appearance.id].imageSrc = makeAppearanceImageResponse.src

                return newAppearanceImageInstructionsObj
            })

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }

        //finish loading
        appearanceImageInstructionsObjSet(prevAppearanceImageInstructionsObj => {
            if (prevAppearanceImageInstructionsObj[appearance.id] === undefined) return prevAppearanceImageInstructionsObj

            //react refresh
            const newAppearanceImageInstructionsObj = { ...prevAppearanceImageInstructionsObj }
            newAppearanceImageInstructionsObj[appearance.id] = { ...newAppearanceImageInstructionsObj[appearance.id] }

            newAppearanceImageInstructionsObj[appearance.id].loading = false

            return newAppearanceImageInstructionsObj
        })
    }

    return (
        <form className={styles.form} action={() => { }}>
            <ShowMore
                label='generate character'
                content={(
                    <div className='container'>
                        <ShowMore
                            label='base instructions'
                            content={
                                <TextArea
                                    name="baseInstructions"
                                    value={makeNewCharacterInstructionsObj.baseInstructions}
                                    placeHolder="Describe how the gpt works..."
                                    onChange={(e) => {
                                        makeNewCharacterInstructionsObjSet(prevMakeNewCharacterInstructionsObj => {
                                            const newMakeNewCharacterInstructionsObj = { ...prevMakeNewCharacterInstructionsObj }
                                            newMakeNewCharacterInstructionsObj.baseInstructions = e.target.value

                                            return newMakeNewCharacterInstructionsObj
                                        })
                                    }}
                                />
                            }
                        />

                        <label>prompt</label>

                        <TextArea
                            name="prompt"
                            value={makeNewCharacterInstructionsObj.prompt}
                            placeHolder="describe your user..."
                            onChange={(e) => {
                                makeNewCharacterInstructionsObjSet(prevMakeNewCharacterInstructionsObj => {
                                    const newMakeNewCharacterInstructionsObj = { ...prevMakeNewCharacterInstructionsObj }
                                    newMakeNewCharacterInstructionsObj.prompt = e.target.value

                                    return newMakeNewCharacterInstructionsObj
                                })
                            }}
                        />

                        <button className="button1"
                            onClick={handleGenerateCharacter}
                            disabled={makeNewCharacterInstructionsObj.loading}
                        >
                            {makeNewCharacterInstructionsObj.loading ? "Generating..." : "Generate Character"}
                        </button>
                    </div>
                )}
            />

            <ShowMore
                label='character emotions'
                content={(
                    <>
                        <Search
                            searchObj={emotionsSearchObj}
                            searchObjSet={emotionsSearchObjSet}
                            searchFunc={async (seenFilters) => {
                                return await getEmotions({ ...seenFilters }, {}, emotionsSearchObj.limit, emotionsSearchObj.offset)
                            }}
                            showPage={true}
                            searchFilters={{
                                type: {
                                    value: "",
                                }
                            }}
                        />

                        {emotionsSearchObj.searchItems.length > 0 && (
                            <ViewItems
                                itemObjs={emotionsSearchObj.searchItems.map(eachSearchItem => {
                                    return {
                                        item: { id: eachSearchItem.type, ...eachSearchItem },
                                        Element: <ViewEmotion seenEmotion={eachSearchItem} />
                                    }
                                })}
                                selectedIds={chosenEmotionTypes ?? []}
                                selectionAction={async (eachEmotionMore) => {
                                    try {
                                        //remove id from object
                                        const { id, ...rest } = eachEmotionMore
                                        const eachEmotion = rest

                                        chosenEmotionTypesSet(prevChosenEmotionTypes => {
                                            if (prevChosenEmotionTypes === undefined) prevChosenEmotionTypes = []

                                            let newChosenEmotionTypes = [...prevChosenEmotionTypes]

                                            const inArray = newChosenEmotionTypes.includes(eachEmotion.type)
                                            if (inArray) {
                                                newChosenEmotionTypes = newChosenEmotionTypes.filter(eachChosenType => eachChosenType !== eachEmotion.type)

                                            } else {
                                                newChosenEmotionTypes = [...newChosenEmotionTypes, eachEmotion.type]
                                            }

                                            return newChosenEmotionTypes
                                        })

                                    } catch (error) {
                                        consoleAndToastError(error)
                                    }
                                }}
                            />
                        )}
                    </>
                )}
            />

            <ShowMore
                label='character tags'
                content={(
                    <>
                        <Search
                            searchObj={tagsSearchObj}
                            searchObjSet={tagsSearchObjSet}
                            searchFunc={async (seenFilters) => {
                                return await getTags({ ...seenFilters }, {}, tagsSearchObj.limit, tagsSearchObj.offset)
                            }}
                            showPage={true}
                            searchFilters={{
                                name: {
                                    value: "",
                                }
                            }}
                        />

                        {tagsSearchObj.searchItems.length > 0 && (
                            <ViewItems
                                itemObjs={tagsSearchObj.searchItems.map(eachSearchItem => {
                                    return {
                                        item: eachSearchItem,
                                        Element: <ViewTag seenTag={eachSearchItem} />
                                    }
                                })}
                                selectedIds={chosenTagIds ?? []}
                                selectionAction={async (eachTag) => {
                                    try {
                                        chosenTagIdsSet(prevChosenTagIds => {
                                            if (prevChosenTagIds === undefined) prevChosenTagIds = []

                                            let newChosenTagIds = [...prevChosenTagIds]

                                            const inArray = newChosenTagIds.includes(eachTag.id)
                                            if (inArray) {
                                                newChosenTagIds = newChosenTagIds.filter(eachChosenId => eachChosenId !== eachTag.id)

                                            } else {
                                                newChosenTagIds = [...newChosenTagIds, eachTag.id]
                                            }

                                            return newChosenTagIds
                                        })

                                    } catch (error) {
                                        consoleAndToastError(error)
                                    }
                                }}
                            />
                        )}
                    </>
                )}
            />

            {formObj.name !== undefined && (
                <>
                    <TextInput
                        name={"name"}
                        value={formObj.name}
                        type={"text"}
                        label={"character name"}
                        placeHolder={"enter character name"}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.name === undefined) return prevFormObj

                                newFormObj.name = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "name") }}
                        errors={formErrors["name"]}
                    />
                </>
            )}

            {formObj.age !== undefined && (
                <>
                    <TextInput
                        name={"age"}
                        value={`${formObj.age}`}
                        type={"text"}
                        label={"character age"}
                        placeHolder={"enter character age"}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.age === undefined) return prevFormObj

                                const seenNum = parseFloat(e.target.value)
                                if (isNaN(seenNum)) return prevFormObj

                                newFormObj.age = seenNum

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "age") }}
                        errors={formErrors["age"]}
                    />
                </>
            )}

            {formObj.voiceId !== undefined && (
                <>
                    <TextInput
                        name={"voiceId"}
                        value={formObj.voiceId}
                        type={"text"}
                        label={"character voiceId"}
                        placeHolder={"enter eleven labs voiceId"}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.voiceId === undefined) return prevFormObj

                                newFormObj.voiceId = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "voiceId") }}
                        errors={formErrors["voiceId"]}
                    />
                </>
            )}

            {formObj.appearances !== undefined && (
                <>
                    <label>appearance options*</label>

                    <div className='gridColumns snap'>
                        {formObj.appearances.map((eachAppearance, eachAppearanceIndex) => {
                            if (eachAppearance.file.status === "to-delete") return null

                            const seenAppearanceImageInstructionsObj = appearanceImageInstructionsObj[eachAppearance.id]
                            if (seenAppearanceImageInstructionsObj === undefined) {
                                appearanceImageInstructionsObjSet(prevAppearanceImageInstructionsObj => {
                                    const newAppearanceImageInstructionsObj = { ...prevAppearanceImageInstructionsObj }

                                    newAppearanceImageInstructionsObj[eachAppearance.id] = {
                                        loading: false,
                                        prompt: `Generate a single, high-resolution character reference sheet of the character described below.

Depict the full body in a clear, neutral standing pose, facing forward.
Use even, neutral lighting and a plain, solid-color background to maximize clarity.
Strictly follow all provided physical appearance details — do not add, remove, or alter any features.
Maintain exact facial structure, age, body proportions, skin tone, hair color, hairstyle, and any notable marks or distinguishing traits.
Clothing, accessories, and style must match the description exactly unless otherwise specified.
Avoid stylization changes, extra props, or backgrounds not mentioned.
The goal is to create a precise visual reference for consistent reproduction in future images.

appearance:
[[appearance]]
`,
                                        imageSrc: "",
                                        mode: "make",
                                    }

                                    return newAppearanceImageInstructionsObj
                                })
                            }

                            let containsFileErrors = false
                            Object.entries(formErrors).forEach(eachEntry => {
                                if (eachEntry[0].includes(`appearances/${eachAppearanceIndex}/file`)) containsFileErrors = true
                            })

                            return (
                                <div key={eachAppearance.id} className='container' style={{ position: "relative", maxHeight: "80vh", overflow: "auto" }}>
                                    <ConfirmationBox text='' confirmationText='Are you sure you want to delete this appearance?' successMessage='appearance deleted!' iconName={"delete"} float={true}
                                        style={{ justifySelf: "flex-end" }}
                                        runAction={() => {
                                            //form has to be valid if wants to delete
                                            if (Object.entries(formErrors).length > 0) {
                                                toast.error("fix form errors before deleting")

                                                return
                                            }

                                            //change status
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.appearances === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.appearances = newFormObj.appearances.map(eachAppearanceMap => {
                                                    if (eachAppearanceMap.id === eachAppearance.id) {
                                                        eachAppearanceMap = { ...eachAppearanceMap }
                                                        eachAppearanceMap.file = { ...eachAppearanceMap.file }
                                                        eachAppearanceMap.file.status = "to-delete"
                                                    }

                                                    return eachAppearanceMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <label>name</label>
                                    <TextInput
                                        name={`${eachAppearance.id}appearanceName`}
                                        value={eachAppearance.name}
                                        placeHolder="Appearance name. E.g Default, Summer..."
                                        onChange={(e) => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.appearances === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.appearances = newFormObj.appearances.map(eachAppearanceMap => {
                                                    if (eachAppearanceMap.id === eachAppearance.id) {
                                                        eachAppearanceMap = { ...eachAppearanceMap }
                                                        eachAppearanceMap.name = e.target.value
                                                    }

                                                    return eachAppearanceMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => checkErrors(formObj)}
                                        errors={formErrors[`appearances/${eachAppearanceIndex}/name`]}
                                    />

                                    {eachAppearance.file.uploadedAlready && sentCharacter !== undefined ? (
                                        <Image alt={`${eachAppearance.file.fileName} image`} width={1000} height={1000} src={`/api/characters/images/download?characterId=${sentCharacter.id}&src=${eachAppearance.file.src}`} style={{ objectFit: "contain", width: "100%" }} />
                                    ) : (
                                        <p>{eachAppearance.file.fileName}</p>
                                    )}

                                    <label>description</label>
                                    <TextArea
                                        name={`${eachAppearance.id}appearanceDescription`}
                                        value={eachAppearance.description}
                                        placeHolder="Descibe in detail the appearance of the character..."
                                        onChange={(e) => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.appearances === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.appearances = newFormObj.appearances.map(eachAppearanceMap => {
                                                    if (eachAppearanceMap.id === eachAppearance.id) {
                                                        eachAppearanceMap = { ...eachAppearanceMap }
                                                        eachAppearanceMap.description = e.target.value
                                                    }

                                                    return eachAppearanceMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                        onBlur={() => checkErrors(formObj)}
                                        errors={formErrors[`appearances/${eachAppearanceIndex}/description`]}
                                    />

                                    <ShowMore
                                        label='generate image'
                                        content={(
                                            <>
                                                {seenAppearanceImageInstructionsObj !== undefined && (
                                                    <div className='container'>
                                                        <ShowMore
                                                            label='prompt'
                                                            content={(
                                                                <div className='container'>
                                                                    <div className='flexContainer'>
                                                                        <button className='button2'
                                                                            onClick={() => {
                                                                                appearanceImageInstructionsObjSet(prevAppearanceIntructionsObj => {
                                                                                    if (prevAppearanceIntructionsObj[eachAppearance.id] === undefined) return prevAppearanceIntructionsObj

                                                                                    //react refresh
                                                                                    const newViewInstructionsObj = { ...prevAppearanceIntructionsObj }
                                                                                    newViewInstructionsObj[eachAppearance.id] = { ...newViewInstructionsObj[eachAppearance.id] }

                                                                                    //toggle
                                                                                    newViewInstructionsObj[eachAppearance.id].mode = newViewInstructionsObj[eachAppearance.id].mode === "make" ? "edit" : "make"

                                                                                    return newViewInstructionsObj
                                                                                })
                                                                            }}
                                                                        >Mode: {seenAppearanceImageInstructionsObj.mode}</button>

                                                                        {seenAppearanceImageInstructionsObj.mode === "edit" && (
                                                                            <>
                                                                                <button className='button2' style={{ justifySelf: "flex-start", backgroundColor: seenAppearanceImageInstructionsObj.formData === undefined ? "" : "var(--c3)" }}>
                                                                                    <label htmlFor={`viewEditImageUpload${eachAppearance.id}`} style={{ cursor: "pointer" }}>
                                                                                        upload
                                                                                    </label>
                                                                                </button>

                                                                                <input id={`viewEditImageUpload${eachAppearance.id}`} type="file" multiple={true} placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
                                                                                    onChange={async (e) => {
                                                                                        try {
                                                                                            if (!e.target.files) return

                                                                                            let totalUploadSize = 0
                                                                                            const uploadedFiles = e.target.files

                                                                                            for (let index = 0; index < uploadedFiles.length; index++) {
                                                                                                const file = uploadedFiles[index];

                                                                                                //validation
                                                                                                if (!allowedImageFileTypes.includes(file.type)) {
                                                                                                    toast.error(`File ${file.name} is not a valid file type to upload.`);
                                                                                                    continue;
                                                                                                }

                                                                                                // Check the file size
                                                                                                if (file.size > maxFileUploadSize) {
                                                                                                    toast.error(`File ${file.name} is too large. Maximum size is ${convertBtyes(maxFileUploadSize, "mb")} MB`);
                                                                                                    continue;
                                                                                                }

                                                                                                //add file size to totalUploadSize
                                                                                                totalUploadSize += file.size

                                                                                                const fileEnding = file.name.split(".")[1]
                                                                                                const fileSrc = `${uuidV4()}.${fileEnding}`

                                                                                                //add to formData
                                                                                                appearanceImageInstructionsObjSet(prevAppearanceIntructionsObj => {
                                                                                                    if (prevAppearanceIntructionsObj[eachAppearance.id] === undefined) return prevAppearanceIntructionsObj

                                                                                                    //react refresh
                                                                                                    const newAppearanceImageInstructionsObj = { ...prevAppearanceIntructionsObj }
                                                                                                    newAppearanceImageInstructionsObj[eachAppearance.id] = { ...newAppearanceImageInstructionsObj[eachAppearance.id] }

                                                                                                    const seenFormData = new FormData();
                                                                                                    seenFormData.append(fileSrc, file)
                                                                                                    newAppearanceImageInstructionsObj[eachAppearance.id].formData = seenFormData

                                                                                                    return newAppearanceImageInstructionsObj
                                                                                                })
                                                                                            }

                                                                                            if (totalUploadSize > maxBodyToServerSize) {
                                                                                                toast.error(`Please upload less than ${convertBtyes(maxBodyToServerSize, "mb")} MB at a time`);
                                                                                                return
                                                                                            }

                                                                                        } catch (error) {
                                                                                            consoleAndToastError(error)
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    <TextArea
                                                                        name={`${eachAppearance.id}generateImagePrompt`}
                                                                        value={seenAppearanceImageInstructionsObj.prompt}
                                                                        placeHolder="Enter the prompt for this image generation..."
                                                                        onChange={(e) => {
                                                                            appearanceImageInstructionsObjSet(prevAppearanceImageInstructionsObj => {
                                                                                if (prevAppearanceImageInstructionsObj[eachAppearance.id] === undefined) return prevAppearanceImageInstructionsObj

                                                                                //react refresh
                                                                                const newAppearanceImageInstructionsObj = { ...prevAppearanceImageInstructionsObj }
                                                                                newAppearanceImageInstructionsObj[eachAppearance.id] = { ...newAppearanceImageInstructionsObj[eachAppearance.id] }

                                                                                newAppearanceImageInstructionsObj[eachAppearance.id].prompt = e.target.value

                                                                                return newAppearanceImageInstructionsObj
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        />

                                                        {seenAppearanceImageInstructionsObj.imageSrc !== "" && (
                                                            <>
                                                                <label>Image preview</label>

                                                                <Image alt={`${eachAppearance.id} image preview`} width={500} height={500} src={`/api/previewImages/download?src=${seenAppearanceImageInstructionsObj.imageSrc}`} style={{ objectFit: "contain", width: "100%" }} />
                                                            </>
                                                        )}

                                                        <button className='button1'
                                                            onClick={() => handleGenerateAppearanceImage(eachAppearance)}
                                                        >
                                                            {seenAppearanceImageInstructionsObj.loading ? "generating..." : "generate"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />

                                    <button className='button1' style={{ justifySelf: "flex-start" }}>
                                        <label htmlFor={`characterImageUpload${eachAppearance.id}`} style={{ cursor: "pointer" }}>
                                            upload
                                        </label>
                                    </button>

                                    <input id={`characterImageUpload${eachAppearance.id}`} type="file" placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
                                        onChange={(e) => {
                                            if (!e.target.files) return

                                            let totalUploadSize = 0
                                            const uploadedFiles = e.target.files

                                            for (let index = 0; index < uploadedFiles.length; index++) {
                                                const file = uploadedFiles[index];

                                                //validation
                                                if (!allowedImageFileTypes.includes(file.type)) {
                                                    toast.error(`File ${file.name} is not a valid file type to upload.`);
                                                    continue;
                                                }

                                                // Check the file size
                                                if (file.size > maxFileUploadSize) {
                                                    toast.error(`File ${file.name} is too large. Maximum size is ${convertBtyes(maxFileUploadSize, "mb")} MB`);
                                                    continue;
                                                }

                                                //add file size to totalUploadSize
                                                totalUploadSize += file.size

                                                const newDate = new Date()

                                                const fileEnding = file.name.split(".")[1]
                                                const fileSrc = `${eachAppearance.id}___${uuidV4()}.${fileEnding}` //ensure refresh

                                                const newDbUploadFile: dbFileType = {
                                                    src: fileSrc,
                                                    createdAt: newDate,
                                                    fileName: file.name,
                                                    status: "to-upload",
                                                    uploadedAlready: false,
                                                    fileCategory: "image"
                                                }

                                                formObjSet(prevFormObj => {
                                                    const newFormObj = { ...prevFormObj }
                                                    if (newFormObj.appearances === undefined) return prevFormObj

                                                    //react refresh
                                                    newFormObj.appearances = newFormObj.appearances.map(eachAppearanceMap => {
                                                        if (eachAppearanceMap.id === eachAppearance.id) {
                                                            eachAppearanceMap = { ...eachAppearanceMap }
                                                            eachAppearanceMap.file = { ...newDbUploadFile }
                                                        }

                                                        return eachAppearanceMap
                                                    })

                                                    //validate
                                                    checkErrors(newFormObj)

                                                    return newFormObj
                                                })

                                                //add to formData
                                                imageFormDataSet(prevFormData => {
                                                    const formData = prevFormData ?? new FormData();
                                                    formData.append(fileSrc, file);

                                                    return formData;
                                                });
                                            }

                                            if (totalUploadSize > maxBodyToServerSize) {
                                                toast.error(`Please upload less than ${convertBtyes(maxBodyToServerSize, "mb")} MB at a time`);
                                                return
                                            }
                                        }}
                                    />

                                    {containsFileErrors && (
                                        <p className='errorText'>Please upload a file</p>
                                    )}
                                </div>
                            )
                        })}

                        <div className='container'>
                            <label>Add New</label>

                            <ShowMore
                                label='generate'
                                content={(
                                    <>
                                        <ShowMore
                                            label='base instructions'
                                            content={(
                                                <TextArea
                                                    name="appearanceStarterInstructionsObjBaseInstructions"
                                                    value={appearanceStarterInstructionsObj.baseInstructions}
                                                    placeHolder="Describe how the gpt works..."
                                                    onChange={(e) => {
                                                        appearanceStarterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                                                            const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }

                                                            newAppearanceStarterInstructionsObj.baseInstructions = e.target.value

                                                            return newAppearanceStarterInstructionsObj
                                                        })
                                                    }}
                                                />

                                            )}
                                        />

                                        <label>prompt</label>
                                        <TextArea
                                            name="appearanceStarterInstructionsObjPrompt"
                                            value={appearanceStarterInstructionsObj.prompt}
                                            placeHolder="Enter your prompt for the new appearance..."
                                            onChange={(e) => {
                                                appearanceStarterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                                                    const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }

                                                    newAppearanceStarterInstructionsObj.prompt = e.target.value

                                                    return newAppearanceStarterInstructionsObj
                                                })
                                            }}
                                        />

                                        <button className='button1'
                                            onClick={handleGenerateAppearanceStarter}
                                        >generate</button>
                                    </>
                                )}
                            />

                            <ShowMore
                                label='manual'
                                content={(
                                    <>
                                        <button className='button1'
                                            onClick={() => {
                                                formObjSet(prevFormObj => {
                                                    const newFormObj = { ...prevFormObj }
                                                    if (newFormObj.appearances === undefined) return prevFormObj

                                                    const newAppearance: appearanceType = {
                                                        id: uuidV4(),
                                                        name: "",
                                                        description: "",
                                                        file: {
                                                            src: "",
                                                            createdAt: new Date(),
                                                            fileName: "",
                                                            status: "to-upload",
                                                            uploadedAlready: false,
                                                            fileCategory: "image"
                                                        },
                                                        uploadedFrom: "main"
                                                    }

                                                    newFormObj.appearances = [...newFormObj.appearances, newAppearance]

                                                    return newFormObj
                                                })
                                            }}
                                        >make new</button>
                                    </>
                                )}
                            />
                        </div>
                    </div>
                </>
            )}

            {formObj.personality !== undefined && (
                <>
                    <TextInput
                        name={"personality"}
                        value={formObj.personality}
                        type={"text"}
                        label={"character personality"}
                        placeHolder={`e.g. "brooding and analytical", "cheerful and impulsive"`}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.personality === undefined) return prevFormObj

                                newFormObj.personality = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "personality") }}
                        errors={formErrors["personality"]}
                    />
                </>
            )}

            {formObj.toneOfVoice !== undefined && (
                <>
                    <TextInput
                        name={"toneOfVoice"}
                        value={formObj.toneOfVoice}
                        type={"text"}
                        label={"character toneOfVoice"}
                        placeHolder={`e.g. "sarcastic", "soft-spoken", "authoritative"`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.toneOfVoice === undefined) return prevFormObj

                                newFormObj.toneOfVoice = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "toneOfVoice") }}
                        errors={formErrors["toneOfVoice"]}
                    />
                </>
            )}

            {formObj.dialogueStyle !== undefined && (
                <>
                    <TextInput
                        name={"dialogueStyle"}
                        value={formObj.dialogueStyle}
                        type={"text"}
                        label={"character dialogueStyle"}
                        placeHolder={`e.g. "uses short, clipped sentences", "speaks in metaphors"`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.dialogueStyle === undefined) return prevFormObj

                                newFormObj.dialogueStyle = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "dialogueStyle") }}
                        errors={formErrors["dialogueStyle"]}
                    />
                </>
            )}

            {formObj.alignment !== undefined && (
                <>
                    <TextInput
                        name={"alignment"}
                        value={formObj.alignment}
                        type={"text"}
                        label={"character alignment"}
                        placeHolder={`e.g. "Lawful Good", "Chaotic Neutral", or your own moral scale`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.alignment === undefined) return prevFormObj

                                newFormObj.alignment = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "alignment") }}
                        errors={formErrors["alignment"]}
                    />
                </>
            )}

            {formObj.goal !== undefined && (
                <>
                    <TextInput
                        name={"goal"}
                        value={formObj.goal}
                        type={"text"}
                        label={"character goal"}
                        placeHolder={`What drives the character`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.goal === undefined) return prevFormObj

                                newFormObj.goal = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "goal") }}
                        errors={formErrors["goal"]}
                    />
                </>
            )}

            {formObj.fear !== undefined && (
                <>
                    <TextInput
                        name={"fear"}
                        value={formObj.fear}
                        type={"text"}
                        label={"character fear"}
                        placeHolder={`What the character is afraid of`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.fear === undefined) return prevFormObj

                                newFormObj.fear = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "fear") }}
                        errors={formErrors["fear"]}
                    />
                </>
            )}

            {formObj.fatalFlaw !== undefined && (
                <>
                    <TextInput
                        name={"fatalFlaw"}
                        value={formObj.fatalFlaw}
                        type={"text"}
                        label={"character fatalFlaw"}
                        placeHolder={`e.g. "trusts too easily", "overconfident"`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.fatalFlaw === undefined) return prevFormObj

                                newFormObj.fatalFlaw = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "fatalFlaw") }}
                        errors={formErrors["fatalFlaw"]}
                    />
                </>
            )}

            {formObj.backstory !== undefined && (
                <>
                    <TextInput
                        name={"backstory"}
                        value={formObj.backstory}
                        type={"text"}
                        label={"character backstory"}
                        placeHolder={`Important past experiences, set the full context`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.backstory === undefined) return prevFormObj

                                newFormObj.backstory = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "backstory") }}
                        errors={formErrors["backstory"]}
                    />
                </>
            )}

            {formObj.occupation !== undefined && (
                <>
                    <TextInput
                        name={"occupation"}
                        value={formObj.occupation}
                        type={"text"}
                        label={"character occupation"}
                        placeHolder={`Their role in the story or world`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.occupation === undefined) return prevFormObj

                                newFormObj.occupation = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "occupation") }}
                        errors={formErrors["occupation"]}
                    />
                </>
            )}

            {formObj.location !== undefined && (
                <>
                    <TextInput
                        name={"location"}
                        value={formObj.location}
                        type={"text"}
                        label={"character location"}
                        placeHolder={`Where they're usually found`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.location === undefined) return prevFormObj

                                newFormObj.location = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "location") }}
                        errors={formErrors["location"]}
                    />
                </>
            )}

            {formObj.archetype !== undefined && (
                <>
                    <TextInput
                        name={"archetype"}
                        value={formObj.archetype}
                        type={"text"}
                        label={"character archetype"}
                        placeHolder={`e.g. "The Hero", "The Trickster", "The Mentor"`}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.archetype === undefined) return prevFormObj

                                newFormObj.archetype = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkErrors(formObj, "archetype") }}
                        errors={formErrors["archetype"]}
                    />
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentCharacter !== undefined ? "update" : "submit"}</button>
        </form>
    )
}