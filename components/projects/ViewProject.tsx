"use client"
import ShowMore from "@/components/showMore/ShowMore"
import { alterScene, makeDialogue, makeSceneImages, makeScenes, makeStory } from "@/serverFunctions/handleGpt"
import { deleteSceneBackgroundImage, refreshProjectPath, updateProject } from "@/serverFunctions/handleProjects"
import { activeCharacterAppearanceType, alterDialogueObjType, alterScenesObjType, characterType, characterAppearanceType, dialogueSchema, dialogueType, downloadProjectBodySchema, downloadProjectBodyType, projectSchema, projectType, sceneSchema, sceneType, searchObjType, updateProjectSchema, uploadFileApiResponseSchema, makeSceneBackgroundImageBodyType, gptApiFunctionCallOptionsType, makeSceneBackgroundImageResponseSchema, makeDialogueAudioBodyType, makeDialogueAudioResponseSchema } from "@/types"
import { consoleAndToastError } from "@/useful/consoleErrorWithToast"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import Search from "../search/Search"
import { getCharacters } from "@/serverFunctions/handleCharacters"
import ViewCharacter from "../characters/ViewCharacter"
import styles from "./style.module.css"
import ViewItems from "../items/ViewItem"
import { addCharacterToProject, deleteCharacterToProject, getSpecificCharacterToProject } from "@/serverFunctions/handleCharactersToProjects"
import TextArea from "../inputs/textArea/TextArea"
import TextInput from "../inputs/textInput/TextInput"
import UseRateLimit from "../rateLimit/UseRateLimit"
import Select from "../inputs/select/Select"
import ConfirmationBox from "../confirmationBox/ConfirmationBox"
import { v4 as uuidV4 } from "uuid"
import { convertBtyes, deepClone } from "@/utility/utility"
import { allowedImageFileTypes, imageFileInputAccept, maxBodyToServerSize, maxFileUploadSize } from "@/lib/uploadFilesLib"

type editModeType = {
    scenes: boolean;
}

export default function ViewProject({ seenProject }: { seenProject: projectType }) {
    const { rateLimit: audioRateLimit } = UseRateLimit({})
    const { rateLimit: sceneRateLimit } = UseRateLimit({ concurrencyLimitVal: 10 })

    const project = useRef<projectType>({ ...seenProject })
    const charactersInProject = project.current.charactersToProjects !== undefined ? project.current.charactersToProjects.map(eachCharacterToProject => eachCharacterToProject.character).filter(each => each !== undefined) : []
    const [projectFormErrors, projectFormErrorsSet] = useState<{ [key: string]: string | undefined }>({})

    const projectSaveDebounce = useRef<{ [key: string]: NodeJS.Timeout | undefined }>({})
    const storyLoading = useRef(false)

    const [projectRefresher, projectRefresherSet] = useState<{ [key in keyof projectType]?: boolean }>({})
    const refreshFromServer = useRef(false)
    const sceneCont = useRef<HTMLDivElement | null>(null)

    const [charactersSearchObj, charactersSearchObjSet] = useState<searchObjType<characterType>>({
        searchItems: [],
    })

    const makeScenesGenerateObj = useRef<{
        prompt: string,
        baseInstructions: string,
        referencedSceneIds: string,
        loading: boolean,
    }>({
        prompt: "",
        baseInstructions: `BaseInstructions:\n[[baseInstructions]]\n\n\nPlease add a new scene/scenes based on the user prompt\n\n\nYou can use these scenes for reference context if needed.\nreferencedScenes:\n[[referencedScenes]]`,
        referencedSceneIds: "",
        loading: false
    })
    const initialMakeScenesNewManualObj: sceneType = {
        id: "",
        title: "",
        dialogue: [],
        backgroundImageSrc: "",
        activeCharacterAppearance: {},
        visualInstructions: "The characters were talking..."
    }
    const makeScenesNewManualObj = useRef<sceneType>({ ...initialMakeScenesNewManualObj })

    const editMode = useRef<editModeType>({
        scenes: false
    })
    const addingSceneIndex = useRef<number | undefined>(undefined)
    const makeImagesInstructionsObj = useRef<{
        prompt: string,
        showing: boolean
    }>({
        prompt: `Add the following characters to the provided scene image, positioning and posing them naturally based on the dialogue and scene context.  

Requirements:
- Match the provided art style exactly.
- Maintain consistent proportions, lighting, and perspective.
- Preserve the characters’ established appearances.

Art Style:
[[artStyle]]

Character Descriptions:
[[characters]]

Scene Description:
[[scene]]
`,
        showing: false,
    })
    const projectSaving = useRef(false)


    //handle changes from above
    useEffect(() => {
        //ensure only runs when deliberate
        if (!refreshFromServer.current) return
        refreshFromServer.current = false

        project.current = { ...seenProject }
        console.log(`$ran server change use effect`);

        //general refresh
        refreshProject([])

    }, [seenProject])

    //set default values on project
    useEffect(() => {
        let chosenKeys: (keyof projectType)[] = []

        if (project.current.prompt === "default") {
            project.current.prompt = "Describe your story idea..."
            chosenKeys.push("prompt")
        }

        if (project.current.artStyle === "default") {
            project.current.artStyle = "watercolor, storybook, clean linework"
            chosenKeys.push("artStyle")
        }

        if (project.current.baseInstructions === "default") {
            project.current.baseInstructions = `Write very short, engaging children’s stories.
            
    The story is broken into scenes, and each scene represents one distinct visual moment.
    If the story changes location, background, scenario, or camera angle, start a new scene.
    Dialogue must match the action, emotion, and mood of the scene it belongs to.
    Characters’ emotions in dialogue must come only from their own character obj.
    
    Each scene should have a visual description that ignores physical appearance and maps what a character is doing e.g Character Name A talking to B. I will use this to generate poses/scene visuals later so choose what you think is best to represent the scene given the dialogue. 
    
    Characters:
    [[characters]]
`
            chosenKeys.push("baseInstructions")
        }

        //save
        if (chosenKeys.length !== 0) {
            refreshProject(chosenKeys)
        }

    }, [])

    //respond to project changes by key
    useEffect(() => {
        const allTrueProjectKeys = Object.entries(projectRefresher).filter(eachEntry => eachEntry[1]).map(eachEntry => eachEntry[0]) as (keyof projectType)[]
        if (allTrueProjectKeys.length < 1) return

        //send off to save
        handleProjectSave(project.current, allTrueProjectKeys)

        //reset to false
        projectRefresherSet(prevProjectRefresher => {
            const newProjectRefresher = { ...prevProjectRefresher }

            allTrueProjectKeys.forEach(eachProjectKey => {
                newProjectRefresher[eachProjectKey] = false
            })

            return newProjectRefresher
        })

    }, [projectRefresher])

    //warn if not saved
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (projectSaving.current) {
                event.preventDefault();
                event.returnValue = ""; // Required for Chrome to show the prompt
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []); // No deps: listener stays active; logic depends on ref value

    async function handleProjectSave(latestProject: Partial<projectType>, specificKeys: (keyof projectType)[] = []) {
        const debounceKey = specificKeys.length > 0 ? specificKeys.join(",") : "default"
        if (projectSaveDebounce.current[debounceKey]) clearTimeout(projectSaveDebounce.current[debounceKey])

        //send off one batch update
        projectSaveDebounce.current[debounceKey] = setTimeout(async () => {
            try {
                //saving
                projectSaving.current = true

                const pickShape = Object.fromEntries(
                    specificKeys.map(key => [key, true])
                ) as { [K in keyof typeof updateProjectSchema.shape]?: true };

                checkProjectErrors(latestProject)
                const validatedProject = specificKeys.length > 0 ? updateProjectSchema.pick(pickShape).parse(latestProject) : updateProjectSchema.parse(latestProject)

                console.log(`$sending to server update`, validatedProject);

                //send to server
                await updateProject(seenProject.id, validatedProject)

                console.log(`$update confirmed on server`);

                //saved
                projectSaving.current = false

            } catch (error) {
                consoleAndToastError(error)
            }
        }, 5_000);
    }

    function refreshProject(projectKeys: (keyof projectType)[]) {
        projectRefresherSet(prevProjectRefresher => {
            const newProjectRefresher = { ...prevProjectRefresher }

            projectKeys.forEach(eachProjectKey => {
                newProjectRefresher[eachProjectKey] = true
            })

            return newProjectRefresher
        })
    }

    async function handleGenerateStory() {
        try {
            //ensure chracters and activeCharacterAppearanceStarter
            if (charactersInProject.length < 1) throw new Error("please add characters to this project generate a story")

            //loading
            storyLoading.current = true

            toast.success("Generating story...")

            //get variables into prompt
            const finalBaseInstructions = addVariablesToString(project.current.baseInstructions, { activeCharacterAppearance: project.current.activeCharacterAppearanceStarter })
            const madeScenes = await makeStory(project.current.prompt, finalBaseInstructions, project.current.activeCharacterAppearanceStarter)

            //add ontp scenes
            project.current.scenes = [...project.current.scenes, ...madeScenes]

            //refresh
            refreshProject(["scenes"])

        } catch (error) {
            consoleAndToastError(error)

        } finally {
            storyLoading.current = false

        }
    }
    async function handleMakeScenes(referencedSceneIds: string) {
        try {
            if (makeScenesGenerateObj.current.prompt === "") throw new Error("not seeing prompt")
            if (makeScenesGenerateObj.current.baseInstructions === "") throw new Error("not seeing base instructions")
            if (addingSceneIndex.current === undefined) throw new Error("not seeing index to add scene")

            toast.success("making scenes")

            const newScenePrompt = makeScenesGenerateObj.current.prompt
            const newSceneBaseInstructions = makeScenesGenerateObj.current.baseInstructions

            //loading
            makeScenesGenerateObj.current.loading = true

            //get scenes referenced for context
            const referencedScenes = getReferencedScenes(referencedSceneIds)

            //get variables into prompt
            const finalBaseInstructions = addVariablesToString(newSceneBaseInstructions, { activeCharacterAppearance: project.current.activeCharacterAppearanceStarter, referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions })
            const madeScenes = await makeScenes(newScenePrompt, finalBaseInstructions, project.current.activeCharacterAppearanceStarter)

            //add the scenes
            project.current.scenes = [
                ...project.current.scenes.slice(0, addingSceneIndex.current), //before
                ...madeScenes,
                ...project.current.scenes.slice(addingSceneIndex.current), //after
            ]

            //finished loading
            makeScenesGenerateObj.current.loading = false

            //refresh
            refreshProject(["scenes"])

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    async function handleGenerateSceneBackgroundImages(scenes: sceneType[]) {
        toast.success("generating images")

        //generate for all
        // const scenesToUse = scenes.filter(eachScene => eachScene.backgroundImageSrc === "")
        scenes.map(async (eachScene, eachSceneIndex) => {
            if (eachSceneIndex !== 0) return

            //rate limit
            await sceneRateLimit(async () => {
                await actualRun(eachScene)
            })

            //notify after all finished
            toast.success("generated!")
        })

        async function actualRun(eachScene: sceneType) {
            try {
                // if (makeImagesInstructionsObj.current.prompt === "") throw new Error("not seeing prompt")

                //go over each character
                //get their active appearances
                //get that image src and make it a full url

                // const finalPrompt = addVariablesToBaseInstructions(makeImagesInstructionsObj.current.prompt, {
                //     activeCharacterAppearance: eachScene.activeCharacterAppearance,
                //     scene: eachScene,
                // })

                // //what function to call
                // const gptApiFunctionCallOption: gptApiFunctionCallOptionsType = "makeSceneBackgroundImage"
                // //new body
                // const newMakeSceneBackgroundImagesBody: makeSceneBackgroundImageBodyType = {
                //     prompt: finalPrompt,
                //     projectId: seenProject.id,
                //     scene: eachScene
                // }

                // //send off to gpt api
                // const response = await fetch(`/api/gptConcurrent?functionCallOption=${gptApiFunctionCallOption}`, {
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json"
                //     },
                //     body: JSON.stringify(newMakeSceneBackgroundImagesBody)
                // })
                // const makeSceneBackgroundImagesResponse = await response.json()
                // console.log(`$makeSceneBackgroundImagesResponse`, makeSceneBackgroundImagesResponse);
                // const makeSceneBackgroundImageObj = makeSceneBackgroundImageResponseSchema.parse(makeSceneBackgroundImagesResponse)

                const promptEx = addVariablesToString(makeImagesInstructionsObj.current.prompt, {
                    activeCharacterAppearance: eachScene.activeCharacterAppearance,//used to slim character appearance down to 1
                    scene: eachScene,
                    artStyle: project.current.artStyle
                })
                console.log(`$promptEx`, promptEx);

                const charactersInScene = charactersInProject.filter(eachCharacterInProject => {
                    const foundInDialogue = eachScene.dialogue.find(eachDialogue => eachDialogue.characterId === eachCharacterInProject.id) !== undefined

                    return foundInDialogue
                })
                console.log(`$charactersInScene`, charactersInScene);

                const sceneImageObj = await makeSceneImages(promptEx, seenProject.id, eachScene, charactersInScene, eachScene.activeCharacterAppearance)

                //update scene backgrounds
                project.current.scenes = project.current.scenes.map(eachSceneMap => {
                    if (eachSceneMap.id === eachScene.id) {
                        eachSceneMap.backgroundImageSrc = sceneImageObj.src
                    }

                    return eachSceneMap
                })

                //refresh
                refreshProject(["scenes"])

            } catch (error) {
                consoleAndToastError(error)
            }
        }
    }

    function addVariablesToString(seenBaseInstructions: string, variables: { activeCharacterAppearance: activeCharacterAppearanceType, scene?: sceneType, referencedScenes?: sceneType[], baseInstructions?: string, artStyle?: string }, atTop = true) {
        //eventually make this accept charactersInProject

        let referencedCharacterImageUrls: string | undefined = undefined

        //add on characters
        //ensure characters only have 1 appearances appearance sent to api
        const finalCharactersInProject = deepClone(charactersInProject).map(eachCharacterInProject => {
            const seenActiveCharacterAppearanceId: activeCharacterAppearanceType["key"] | undefined = variables.activeCharacterAppearance[eachCharacterInProject.id]
            if (seenActiveCharacterAppearanceId === undefined) throw new Error(`not seeing appearances for ${eachCharacterInProject.name}`)

            const activeAppearance = eachCharacterInProject.appearances.find(eachAppearance => eachAppearance.id === seenActiveCharacterAppearanceId)
            if (activeAppearance === undefined) throw new Error(`not seeing appearances item in character ${eachCharacterInProject.name} array`)

            //assign single appearances item
            eachCharacterInProject.appearances = [activeAppearance]

            //assign images if appearances found
            if (referencedCharacterImageUrls === undefined) referencedCharacterImageUrls = ""
            referencedCharacterImageUrls += `${window.location.origin}/api/characters/images/download?characterId=${eachCharacterInProject.id}&src=${activeAppearance.file.src}\n`

            return eachCharacterInProject
        })
        seenBaseInstructions = seenBaseInstructions.replaceAll("[[characters]]", JSON.stringify(finalCharactersInProject, null, 2))

        if (variables.scene !== undefined) {
            //add on scene
            seenBaseInstructions = seenBaseInstructions.replaceAll("[[scene]]", JSON.stringify(variables.scene, null, 2))
        }

        if (variables.referencedScenes !== undefined) {
            //add on reference Scenes
            if (variables.referencedScenes.length > 0) {
                seenBaseInstructions = seenBaseInstructions.replaceAll("[[referencedScenes]]", JSON.stringify(variables.referencedScenes, null, 2))
            }
        }

        if (variables.baseInstructions !== undefined) {
            //prevent loop
            if (atTop) {
                //add on baseInstructions
                seenBaseInstructions = seenBaseInstructions.replaceAll("[[baseInstructions]]", addVariablesToString(variables.baseInstructions, variables, false))
            }
        }

        if (variables.artStyle !== undefined) {
            //add on reference Scenes
            seenBaseInstructions = seenBaseInstructions.replaceAll("[[artStyle]]", variables.artStyle)
        }

        return seenBaseInstructions
    }

    function checkProjectErrors(seenFormObj: Partial<projectType>) {
        projectFormErrorsSet({})

        const testSchema = projectSchema.partial().safeParse(seenFormObj);

        if (testSchema.success) {
            return false

        } else {
            testSchema.error.issues.map(eachIssue => {
                projectFormErrorsSet(prevObj => {
                    const newObj = { ...prevObj }
                    const seenPath = eachIssue.path.join("/")

                    newObj[seenPath] = eachIssue.message

                    return newObj
                })
            })

            return true
        }
    }

    function makeDefaultAlterDialogueObj(): alterDialogueObjType["key"] {
        return {
            loading: false,
            audioFileNameArray: [],
            variationIndex: 0,
            audioEditable: true
        }
    }
    function handleDialogueVariationSwitch(dialogueId: dialogueType["id"], option: "next" | "prev") {
        if (project.current.alterDialogueObj[dialogueId] === undefined) throw new Error("not seeing alter dialogue obj for dialogue id")
        const seenVariations = project.current.alterDialogueObj[dialogueId].audioFileNameArray

        //get index
        let seenIndex = project.current.alterDialogueObj[dialogueId].variationIndex

        if (option === "next") {
            seenIndex++

            //keep in bounds
            if (seenIndex > seenVariations.length - 1) {
                seenIndex = 0
            }

        } else {
            seenIndex--

            //keep in bounds
            if (seenIndex < 0) {
                seenIndex = seenVariations.length - 1
            }
        }

        //update vriation index
        project.current.alterDialogueObj[dialogueId].variationIndex = seenIndex

        refreshProject(["alterDialogueObj"])
    }
    async function handleDialogueAudio(eachDialogue: dialogueType) {
        //rate limit
        await audioRateLimit(async () => {
            await actualRun()
        })

        //after all resolved
        toast.success("generated")

        async function actualRun() {
            try {
                const foundCharacter = charactersInProject.find(eachCharacter => eachCharacter.id === eachDialogue.characterId)
                if (foundCharacter === undefined) throw new Error("not seeing character for dialogue id")

                //start alterF=DialogueObj
                if (project.current.alterDialogueObj[eachDialogue.id] === undefined) {
                    project.current.alterDialogueObj[eachDialogue.id] = makeDefaultAlterDialogueObj()
                }

                //ensure only generate audio for dialogue wanted
                if (!project.current.alterDialogueObj[eachDialogue.id].audioEditable) {
                    return
                }

                //start loading
                project.current.alterDialogueObj[eachDialogue.id].loading = true

                //what function to call
                const gptApiFunctionCallOption: gptApiFunctionCallOptionsType = "makeDialogueAudio"
                //new body
                const newMakeDialogueAudioBody: makeDialogueAudioBodyType = {
                    line: eachDialogue.sentence,
                    projectId: seenProject.id,
                    dialogueId: eachDialogue.id,
                    character: foundCharacter,
                    variationIndex: project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.length
                }

                //send off to gpt api
                const response = await fetch(`/api/gptConcurrent?functionCallOption=${gptApiFunctionCallOption}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newMakeDialogueAudioBody)
                })
                const makeDialogueAudioResponse = makeDialogueAudioResponseSchema.parse(await response.json())

                //react refresh
                project.current = { ...project.current }
                project.current.alterDialogueObj = { ...project.current.alterDialogueObj }
                project.current.alterDialogueObj[eachDialogue.id] = { ...project.current.alterDialogueObj[eachDialogue.id] }

                //add on audio fileName
                project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray = [...project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray, makeDialogueAudioResponse.dialogueAudioFileName]

                //set variation Index to latest
                project.current.alterDialogueObj[eachDialogue.id].variationIndex = project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.length - 1

                //set audioEditable to false - ensures we don't overwrite if unecessary
                project.current.alterDialogueObj[eachDialogue.id].audioEditable = false

                //finish loading
                project.current.alterDialogueObj[eachDialogue.id].loading = false

                //refresh
                refreshProject(["alterDialogueObj"])

            } catch (error) {
                consoleAndToastError(error)
            }
        }
    }

    function getReferencedScenes(referencedSceneIds: string) {
        //get scenes referenced for context
        const referencedScenesIdArr: sceneType["id"][] = referencedSceneIds !== "" ? referencedSceneIds.split(",") : []

        const referencedScenes = referencedScenesIdArr.map(eachReferenceId => {
            const foundScene = project.current.scenes.find(eachScene => eachScene.id === eachReferenceId.trim())
            if (foundScene === undefined) throw new Error("not seeing scene with id specified")

            return foundScene
        })

        return referencedScenes
    }

    async function handleMakeOutput() {
        try {
            //download 
            toast.success("downloading project")

            const newDownloadProjectBody: downloadProjectBodyType = {
                projectId: seenProject.id,
            }

            //validation
            downloadProjectBodySchema.parse(newDownloadProjectBody)

            const response = await fetch(`/api/projects/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newDownloadProjectBody),
            })

            //notify
            toast.success("downloaded!")

            //download action
            const responseBlob = await response.blob()
            const url = window.URL.createObjectURL(responseBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${seenProject.name}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    const seeingFixed = Object.entries(project.current.alterDialogueObj).filter(eachEntry => !eachEntry[1].audioEditable).length > 0

    return (
        <main className={styles.main}>
            <section>
                <ShowMore
                    label='characters'
                    content={(
                        <div className='container'>
                            <ShowMore
                                label='search'
                                content={(
                                    <div className="container">
                                        <Search
                                            searchObj={charactersSearchObj}
                                            searchObjSet={charactersSearchObjSet}
                                            searchFunc={async (seenFilters) => {
                                                return await getCharacters({ ...seenFilters, userId: seenProject.userId }, {}, charactersSearchObj.limit, charactersSearchObj.offset)
                                            }}
                                            showPage={true}
                                            searchFilters={{
                                                name: {
                                                    value: "",
                                                }
                                            }}
                                        />

                                        {charactersSearchObj.searchItems.length > 0 && (
                                            <ViewItems
                                                itemObjs={charactersSearchObj.searchItems.map(eachSearchItem => {
                                                    return {
                                                        item: eachSearchItem,
                                                        Element: <ViewCharacter seenCharacter={eachSearchItem} viewAll={false} />
                                                    }
                                                })}
                                                selectedIds={charactersInProject.map(eachCharacterInProject => eachCharacterInProject.id)}
                                                selectionAction={async (eachCharacter) => {
                                                    try {
                                                        //server functions
                                                        const inProject = await getSpecificCharacterToProject({ characterId: eachCharacter.id, projectId: seenProject.id }) !== undefined

                                                        if (!inProject) {
                                                            await addCharacterToProject({ characterId: eachCharacter.id, projectId: seenProject.id })
                                                            toast.success("selected user")

                                                        } else {
                                                            await deleteCharacterToProject({ characterId: eachCharacter.id, projectId: seenProject.id })
                                                            toast.success("de-selected user")
                                                        }

                                                        //refresh project from server
                                                        refreshFromServer.current = true
                                                        refreshProjectPath(seenProject.id)

                                                    } catch (error) {
                                                        consoleAndToastError(error)
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                                startShowing={true}
                            />

                            {charactersInProject.length > 0 && (
                                <>
                                    <h2>Characters in project</h2>

                                    <ViewItems
                                        itemObjs={charactersInProject.map(eachCharacterInProject => {
                                            const seenActiveCharacterAppearanceId: activeCharacterAppearanceType["key"] = project.current.activeCharacterAppearanceStarter[eachCharacterInProject.id]
                                            const foundAppearance: characterAppearanceType | undefined = seenActiveCharacterAppearanceId !== undefined ? eachCharacterInProject.appearances.find(eachAppearance => eachAppearance.id === seenActiveCharacterAppearanceId) : undefined

                                            //ensure exists for character for first time
                                            if (seenActiveCharacterAppearanceId === undefined) {
                                                //update activeCharacterAppearanceStarter
                                                project.current.activeCharacterAppearanceStarter[eachCharacterInProject.id] = eachCharacterInProject.appearances[0].id

                                                //refresh
                                                refreshProject(["activeCharacterAppearanceStarter"])
                                            }

                                            return {
                                                item: eachCharacterInProject,
                                                Element: (
                                                    <div className="container">
                                                        <ViewCharacter seenCharacter={eachCharacterInProject} viewAll={false} />

                                                        {seenActiveCharacterAppearanceId !== undefined && foundAppearance !== undefined && (
                                                            <>
                                                                <b>Appearance start</b>

                                                                <Select
                                                                    name={`${eachCharacterInProject.id}ActiveCharacterAppearanceStarter`}
                                                                    value={foundAppearance.name}
                                                                    valueOptions={eachCharacterInProject.appearances.map(eachAppearance => eachAppearance.name)}
                                                                    onChange={value => {
                                                                        const activeAppearance: characterAppearanceType | undefined = eachCharacterInProject.appearances.find(eachAppearance => eachAppearance.name === value)
                                                                        if (activeAppearance === undefined) throw new Error("not seeing activeAppearance from name")

                                                                        project.current.activeCharacterAppearanceStarter[eachCharacterInProject.id] = activeAppearance.id

                                                                        //refresh
                                                                        refreshProject(["activeCharacterAppearanceStarter"])
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        })}
                                    />
                                </>
                            )}
                        </div>
                    )}
                    startShowing={charactersInProject.length === 0}
                />

                <h2>Story Prompt</h2>

                <ShowMore
                    label='general behaviour'
                    content={
                        <TextArea
                            name="baseInstructions"
                            value={project.current.baseInstructions}
                            placeHolder="Describe how the gpt works..."
                            onChange={(e) => {
                                project.current.baseInstructions = e.target.value

                                //refresh
                                refreshProject(["baseInstructions"])
                            }}
                            onBlur={() => checkProjectErrors(project.current)}
                        />
                    }
                />

                <ShowMore
                    label='Story idea'
                    content={
                        <TextArea
                            name="prompt"
                            value={project.current.prompt}
                            placeHolder="Describe your story idea..."
                            onChange={(e) => {
                                project.current.prompt = e.target.value

                                //refresh
                                refreshProject(["prompt"])
                            }}
                            onBlur={() => checkProjectErrors(project.current)}
                            errors={projectFormErrors["prompt"]}
                        />
                    }
                    startShowing={true}
                />

                <label>art style</label>
                <TextInput
                    name="prompt"
                    value={project.current.artStyle}
                    placeHolder="Describe your artStyle - specific..."
                    onChange={(e) => {
                        project.current.artStyle = e.target.value

                        //refresh
                        refreshProject(["artStyle"])
                    }}
                    onBlur={() => checkProjectErrors(project.current)}
                    errors={projectFormErrors["artStyle"]}
                />

                <button
                    onClick={async () => {
                        await handleGenerateStory()
                    }}
                    disabled={storyLoading.current}
                    className="button1"
                >
                    {storyLoading.current ? "Generating..." : "Generate Story"}
                </button>
            </section>

            <section>
                {storyLoading.current && (<p>loading...</p>)}

                {project.current.scenes.length > 0 ? (
                    <>
                        <div style={{ display: "flex", gap: "var(--spacingS)" }}>
                            <h2>scenes</h2>

                            <button
                                onClick={() => {
                                    editMode.current.scenes = !editMode.current.scenes

                                    //general refresh
                                    refreshProject([])
                                }}
                            >
                                <span className="material-symbols-outlined">
                                    {editMode.current.scenes ? "close_small" : "edit"}
                                </span>
                            </button>

                            <button className="button2"
                                onClick={() => {
                                    makeImagesInstructionsObj.current.showing = !makeImagesInstructionsObj.current.showing
                                    //general refresh
                                    refreshProject([])

                                    //focus to start
                                    setTimeout(() => {
                                        if (makeImagesInstructionsObj.current.showing && sceneCont.current !== null) {
                                            sceneCont.current.scrollLeft = 0
                                        }
                                    }, 100);
                                }}
                            >{makeImagesInstructionsObj.current.showing ? "show less" : "make images"}</button>
                        </div>

                        <div ref={sceneCont} className="container gridColumns snap" style={{ gridAutoColumns: "min(500px, 90%)" }}>
                            {makeImagesInstructionsObj.current.showing && (
                                <div className="container">
                                    <label>scene image generation</label>

                                    <ShowMore
                                        label="prompt"
                                        content={(
                                            <TextArea
                                                name={`sceneBackgroundGenerationPrompt`}
                                                value={makeImagesInstructionsObj.current.prompt}
                                                placeHolder="Set the prompt for the image generation..."
                                                onChange={(e) => {
                                                    makeImagesInstructionsObj.current.prompt = e.target.value

                                                    //general refresh
                                                    refreshProject([])
                                                }}
                                            />
                                        )}
                                    />

                                    {makeImagesInstructionsObj.current.showing && (
                                        <button className="button2"
                                            onClick={() => {
                                                handleGenerateSceneBackgroundImages(project.current.scenes)
                                            }}
                                        >make images</button>
                                    )}
                                </div>
                            )}

                            {project.current.scenes.map((eachScene, eachSceneIndex) => {

                                return (
                                    <React.Fragment key={eachScene.id}>
                                        {editMode.current.scenes ? (
                                            <>
                                                <EditScene scene={eachScene} project={project} charactersInProject={charactersInProject} refreshProject={refreshProject} projectFormErrors={projectFormErrors} checkProjectErrors={checkProjectErrors} getReferencedScenes={getReferencedScenes} addVariablesToBaseInstructions={addVariablesToString} addingSceneIndex={addingSceneIndex} />

                                                {addingSceneIndex.current !== undefined && addingSceneIndex.current === (eachSceneIndex + 1) && (
                                                    <div className="container">
                                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                            <button
                                                                onClick={() => {
                                                                    addingSceneIndex.current = undefined

                                                                    //general refresh
                                                                    refreshProject([])
                                                                }}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    close
                                                                </span>
                                                            </button>
                                                        </div>


                                                        <h2>Make scenes</h2>

                                                        <ShowMore
                                                            label='generate'
                                                            content={
                                                                <div className="container">
                                                                    <ShowMore
                                                                        label="base instructions"
                                                                        content={
                                                                            <TextArea
                                                                                name={`newSceneBaseInstructions${eachScene.id}`}
                                                                                value={makeScenesGenerateObj.current.baseInstructions}
                                                                                placeHolder="Set the base instructions for the new scenes."
                                                                                onChange={(e) => {
                                                                                    makeScenesGenerateObj.current.baseInstructions = e.target.value

                                                                                    //general refresh
                                                                                    refreshProject([])
                                                                                }}
                                                                            />
                                                                        }
                                                                    />

                                                                    <ShowMore
                                                                        label="new scene prompt"
                                                                        content={
                                                                            <TextArea
                                                                                name={`newScenePrompt${eachScene.id}`}
                                                                                value={makeScenesGenerateObj.current.prompt}
                                                                                placeHolder="Add a new scene(s) based on your prompt"
                                                                                onChange={(e) => {
                                                                                    makeScenesGenerateObj.current.prompt = e.target.value

                                                                                    //refresh
                                                                                    refreshProject([])
                                                                                }}
                                                                            />
                                                                        }
                                                                    />

                                                                    <ShowMore
                                                                        label="referenced scene id's"
                                                                        content={
                                                                            <TextInput
                                                                                name={`newSceneReferencedSceneIds${eachScene.id}`}
                                                                                value={makeScenesGenerateObj.current.referencedSceneIds}
                                                                                placeHolder="Enter other scene id's. e.g ID1, ID2"
                                                                                onChange={(e) => {
                                                                                    makeScenesGenerateObj.current.referencedSceneIds = e.target.value

                                                                                    //general refresh
                                                                                    refreshProject([])
                                                                                }}
                                                                            />
                                                                        }
                                                                    />

                                                                    <button className="button1"
                                                                        onClick={() => {
                                                                            handleMakeScenes(makeScenesGenerateObj.current.referencedSceneIds)
                                                                        }}
                                                                    >make</button>
                                                                </div>
                                                            }
                                                        />

                                                        <ShowMore
                                                            label='manual'
                                                            content={
                                                                <div className="container">
                                                                    <label>title</label>
                                                                    <TextInput
                                                                        name="makeScenesNewManualObjTitle"
                                                                        value={makeScenesNewManualObj.current.title}
                                                                        placeHolder="Set the title for the new Scene."
                                                                        onChange={(e) => {
                                                                            makeScenesNewManualObj.current.title = e.target.value

                                                                            //general refresh
                                                                            refreshProject([])
                                                                        }}
                                                                    />

                                                                    <label>visual instructions</label>
                                                                    <TextInput
                                                                        name="makeScenesNewManualObjVisualInstructions"
                                                                        value={makeScenesNewManualObj.current.visualInstructions}
                                                                        placeHolder="Set what's happening visually in the scene."
                                                                        onChange={(e) => {
                                                                            makeScenesNewManualObj.current.visualInstructions = e.target.value

                                                                            //general refresh
                                                                            refreshProject([])
                                                                        }}
                                                                    />

                                                                    <button className="button1"
                                                                        onClick={() => {
                                                                            const newScene: sceneType = {
                                                                                ...makeScenesNewManualObj.current,
                                                                                id: uuidV4(),
                                                                                activeCharacterAppearance: project.current.activeCharacterAppearanceStarter,
                                                                            }

                                                                            //validation
                                                                            sceneSchema.parse(newScene)

                                                                            //add onto scenes
                                                                            project.current.scenes = [
                                                                                ...project.current.scenes.slice(0, addingSceneIndex.current), //before
                                                                                newScene,
                                                                                ...project.current.scenes.slice(addingSceneIndex.current), //after
                                                                            ]

                                                                            //reset
                                                                            makeScenesNewManualObj.current = { ...initialMakeScenesNewManualObj }

                                                                            //refresh
                                                                            refreshProject(["scenes"])
                                                                        }}
                                                                    >add</button>
                                                                </div>
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <ViewScene scene={eachScene} charactersInProject={charactersInProject} project={project} />
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <p>Your generated scenes will appear here.</p>
                )}
            </section>

            <section>
                {project.current.scenes.length > 0 ? (
                    <>
                        <h2>audio</h2>

                        <div style={{ display: "flex", justifyContent: "center", gap: "var(--spacingS)" }}>
                            <button className="button1"
                                onClick={() => {
                                    toast.success("generating!")

                                    //call handle dialogue for all
                                    project.current.scenes.forEach(eachScene => {
                                        eachScene.dialogue.forEach(eachDialogue => {
                                            handleDialogueAudio(eachDialogue)
                                        })
                                    })
                                }}
                            >generate audio</button>

                            {seeingFixed && (
                                <button className="button2"
                                    onClick={async () => {
                                        Object.entries(project.current.alterDialogueObj).map(eachEntry => {
                                            const eachKey = eachEntry[0]
                                            const eachValue = eachEntry[1]

                                            eachValue.audioEditable = true

                                            project.current.alterDialogueObj[eachKey] = eachValue
                                        })

                                        toast.success("all audio now editable!")

                                        refreshProject(["alterDialogueObj"])
                                    }}
                                >set all editable</button>
                            )}
                        </div>

                        <div className="container gridColumns snap" style={{ gridAutoColumns: "min(500px, 90%)", marginTop: "var(--spacingR)" }}>
                            {project.current.scenes.map((eachScene) => {

                                return (
                                    <div key={eachScene.id} className="container" style={{ overflow: "auto" }}>
                                        <h3>{eachScene.title}</h3>

                                        {eachScene.dialogue.map(eachDialogue => {
                                            //ensure audio id mapped to dialogue
                                            const seenAlterDialogueObj: alterDialogueObjType["key"] | undefined = project.current.alterDialogueObj[eachDialogue.id]

                                            return (
                                                <div key={eachDialogue.id} className="container" style={{ justifyItems: "center" }}>
                                                    {seenAlterDialogueObj !== undefined ? (
                                                        <>
                                                            <button className="button2" style={{ justifySelf: "flex-end" }}
                                                                onClick={async () => {
                                                                    if (project.current.alterDialogueObj[eachDialogue.id] === undefined) throw new Error("not seeing alter dialogue obj for dialogue id")

                                                                    //switch
                                                                    project.current.alterDialogueObj[eachDialogue.id].audioEditable = !project.current.alterDialogueObj[eachDialogue.id].audioEditable

                                                                    refreshProject(["alterDialogueObj"])
                                                                }}
                                                            >{seenAlterDialogueObj.audioEditable ? "can edit" : "fixed"}</button>

                                                            <ViewDialogue dialogue={eachDialogue} charactersInProject={charactersInProject} />

                                                            <button className="button2" disabled={!seenAlterDialogueObj.audioEditable}
                                                                onClick={async () => {
                                                                    toast.success("generating!")

                                                                    await handleDialogueAudio(eachDialogue)
                                                                }}
                                                            >regenerate</button>

                                                            <ShowAudio seenAlterDialogueObj={seenAlterDialogueObj} seenProjectId={seenProject.id} />

                                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingS)" }}>
                                                                <button className="button2"
                                                                    onClick={() => {
                                                                        handleDialogueVariationSwitch(eachDialogue.id, "prev")
                                                                    }}
                                                                >prev</button>

                                                                <button className="button2"
                                                                    onClick={() => {
                                                                        handleDialogueVariationSwitch(eachDialogue.id, "next")
                                                                    }}
                                                                >next</button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p>Generate audio for dialogue</p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <p>Your audio will appear here.</p>
                )}
            </section>

            <section>
                <h2>Output {"(After Effects)"}</h2>

                <button className="button1"
                    onClick={handleMakeOutput}
                >make output</button>
            </section>
        </main>
    )
}



















function ViewScene({ scene, charactersInProject, project }: {
    scene: sceneType, charactersInProject: characterType[], project: React.RefObject<projectType>,
}) {
    return (
        <div className="container" style={{ backgroundColor: "var(--bg2)", padding: "var(--spacingR)", overflow: "auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <h3>{scene.title}</h3>
            </div>

            {scene.backgroundImageSrc !== "" && (
                <Image alt={`scene${scene.id}backgroundImage`} src={`/api/projects/images/download?projectId=${project.current.id}&src=${scene.backgroundImageSrc}`} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />

            )}

            <div className="container">
                {scene.dialogue.map(eachDialogue => {
                    return (
                        <ViewDialogue key={eachDialogue.id} dialogue={eachDialogue} charactersInProject={charactersInProject} />
                    )
                })}
            </div>
        </div>
    )
}
function EditScene({ scene, charactersInProject, project, refreshProject, projectFormErrors, checkProjectErrors, getReferencedScenes, addVariablesToBaseInstructions, addingSceneIndex }: { scene: sceneType, charactersInProject: characterType[], project: React.RefObject<projectType>, refreshProject(projectKeys: (keyof projectType)[]): void, projectFormErrors: { [key: string]: string | undefined; }, checkProjectErrors(seenFormObj: Partial<projectType>): boolean, getReferencedScenes(referencedSceneIds: string): sceneType[], addVariablesToBaseInstructions(seenBaseInstructions: string, variables: { activeCharacterAppearance: Record<string, string>; scene?: sceneType; referencedScenes?: sceneType[]; baseInstructions?: string; referencedCharacterImageUrls?: true }, atTop?: boolean): string, addingSceneIndex: React.RefObject<number | undefined> }) {
    const seenAlterScenesObj: alterScenesObjType["key"] | undefined = project.current.alterScenesObj[scene.id]
    const sceneIndex = project.current.scenes.findIndex(eachFindIndex => eachFindIndex.id === scene.id)
    const wantedNewSceneIndex = useRef(sceneIndex)

    const addingDialogueIndex = useRef<number | undefined>(undefined)

    const makeDialogueGenerateObj = useRef<{
        prompt: string,
        baseInstructions: string,
        referencedSceneIds: string,
        loading: boolean,
    }>({
        prompt: "",
        baseInstructions: `BaseInstructions:\n[[baseInstructions]]\n\n\nPlease add new dialogue based on the user prompt\n\n\nYou can use these scenes for reference context if needed.\n[[referencedScenes]]`,
        referencedSceneIds: "",
        loading: false
    })
    const initialMakeDialogueNewManualObj: dialogueType = {
        id: "",
        characterId: "",
        sentence: "",
        emotions: null,
    }
    const makeDialogueNewManualObj = useRef<dialogueType>({ ...initialMakeDialogueNewManualObj })

    //respond to changing sceneIndex
    useEffect(() => {
        wantedNewSceneIndex.current = sceneIndex

        //general refresh
        refreshProject([])
    }, [sceneIndex])

    function makeDefaultAlterScenesObj(): alterScenesObjType["key"] {
        return {
            loading: false,
            prompt: "Enter your prompt here",
            baseInstructions: `BaseInstructions:\n[[baseInstructions]]\n\n\nPlease alter the scene below using the users prompt.\nScene:\n[[scene]]\n\n\nYou can use these scenes for reference context if needed.\n[[referencedScenes]]`,
            referencedScenes: "",
            variationIndex: 1, //there's 2 records initially
            variations: []
        }
    }

    async function handleAlterScene(sceneToReplace: sceneType, referencedSceneIds: string) {
        try {
            if (project.current.alterScenesObj[sceneToReplace.id] === undefined) throw new Error("not seeing scene to replace")

            toast.success("altering scene")

            const scenePrompt = project.current.alterScenesObj[sceneToReplace.id].prompt
            const sceneBaseInstructions = project.current.alterScenesObj[sceneToReplace.id].baseInstructions

            //loading
            project.current.alterScenesObj[sceneToReplace.id].loading = true

            //get scenes referenced for context
            const referencedScenes = getReferencedScenes(referencedSceneIds)

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(sceneBaseInstructions, { activeCharacterAppearance: sceneToReplace.activeCharacterAppearance, scene: sceneToReplace, referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions })
            const alteredScene = await alterScene(scenePrompt, finalBaseInstructions, sceneToReplace)

            const newReplacedScene = { ...alteredScene }

            //save scenes to variations - old and new
            project.current.alterScenesObj[sceneToReplace.id].variations = [...project.current.alterScenesObj[sceneToReplace.id].variations, sceneToReplace, newReplacedScene]

            //replace the scene
            project.current.scenes = project.current.scenes.map(eachScene => {
                if (eachScene.id === sceneToReplace.id) {
                    //keep og id
                    eachScene = newReplacedScene
                }

                return eachScene
            })

            //finished loading
            project.current.alterScenesObj[sceneToReplace.id].loading = false

            //refresh
            refreshProject(["scenes", "alterScenesObj"])

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function handleSceneVariationSwitch(sceneId: sceneType["id"], option: "next" | "prev") {
        if (project.current.alterScenesObj[sceneId] === undefined) throw new Error("not seeing alter scenes obj for scene id")
        const seenVariations = project.current.alterScenesObj[sceneId].variations

        //get index
        let seenIndex = project.current.alterScenesObj[sceneId].variationIndex

        if (option === "next") {
            seenIndex++

            //keep in bounds
            if (seenIndex > seenVariations.length - 1) {
                seenIndex = 0
            }

        } else {
            seenIndex--

            //keep in bounds
            if (seenIndex < 0) {
                seenIndex = seenVariations.length - 1
            }
        }

        //set new scene
        const newScene: sceneType = seenVariations[seenIndex]

        //update vriation index
        project.current.alterScenesObj[sceneId].variationIndex = seenIndex

        //update scene array
        project.current.scenes = project.current.scenes.map(eachScene => {
            if (eachScene.id === sceneId) {
                eachScene = { ...newScene }
            }

            return eachScene
        })

        refreshProject(["scenes", "alterScenesObj"])
    }

    function updateDialogue(seenText: string, seenKey: keyof dialogueType, seenDialogueId: dialogueType["id"]) {
        project.current.scenes = project.current.scenes.map(eachSceneMap => {
            if (eachSceneMap.id === scene.id) {
                eachSceneMap.dialogue = eachSceneMap.dialogue.map(eachDialogueMap => {
                    if (eachDialogueMap.id === seenDialogueId) {
                        if (seenKey === "sentence") {
                            eachDialogueMap.sentence = seenText

                        } else if (seenKey === "emotions") {
                            eachDialogueMap.emotions = seenText === "null" ? null : seenText

                        } else if (seenKey === "characterId") {
                            eachDialogueMap.characterId = seenText
                        }

                        //make audio editable since dialogue changed
                        const seenAlterDialogueObj: alterDialogueObjType["key"] | undefined = project.current.alterDialogueObj[seenDialogueId]
                        if (seenAlterDialogueObj !== undefined) {
                            project.current.alterDialogueObj[seenDialogueId].audioEditable = true
                        }
                    }

                    return eachDialogueMap
                })
            }

            return eachSceneMap
        })

        refreshProject(["scenes"])
    }

    function changeSceneIndex(option: "next" | "prev" | number) {
        if (sceneIndex === -1) throw new Error("not seeing scene index")

        let newIndex = sceneIndex

        if (typeof option === "number") {
            newIndex = option

        } else {
            if (option === "next") {
                newIndex++

            } else {
                //prev
                newIndex--
            }
        }

        //keep in bounds
        if (newIndex > project.current.scenes.length - 1) {
            newIndex = 0
        }

        if (newIndex < 0) {
            newIndex = project.current.scenes.length - 1
        }

        const originalItem = project.current.scenes.splice(sceneIndex, 1)

        const newScenes: sceneType[] = [
            ...project.current.scenes.slice(0, newIndex),//before
            ...originalItem,
            ...project.current.scenes.slice(newIndex),//after
        ]

        project.current.scenes = newScenes

        refreshProject(["scenes"])
    }
    function changeDialogueIndex(dialogueIndex: number, option: "next" | "prev" | number) {
        if (sceneIndex === -1) throw new Error("not seeing scene index")
        const seenDialogue = project.current.scenes[sceneIndex].dialogue

        if (dialogueIndex === -1) throw new Error("not seeing dialogue index")

        let newIndex = dialogueIndex

        if (typeof option === "number") {
            newIndex = option

        } else {
            if (option === "next") {
                newIndex++

            } else {
                //prev
                newIndex--
            }
        }

        //keep in bounds
        if (newIndex > seenDialogue.length - 1) {
            newIndex = 0
        }

        if (newIndex < 0) {
            newIndex = seenDialogue.length - 1
        }

        const originalItem = seenDialogue.splice(dialogueIndex, 1)

        const newDialogue: dialogueType[] = [
            ...seenDialogue.slice(0, newIndex),//before
            ...originalItem,
            ...seenDialogue.slice(newIndex),//after
        ]

        //add the new dialogue
        project.current.scenes = project.current.scenes.map(eachScene => {
            if (eachScene.id === scene.id) {
                eachScene.dialogue = [...newDialogue]
            }

            return eachScene
        })

        refreshProject(["scenes"])
    }

    async function handleMakeDialogue(referencedSceneIds: string) {
        try {
            if (makeDialogueGenerateObj.current.prompt === "") throw new Error("not seeing prompt")
            if (makeDialogueGenerateObj.current.baseInstructions === "") throw new Error("not seeing base instructions")
            if (addingDialogueIndex.current === undefined) throw new Error("not seeing index to add dialogue")

            toast.success("making dialogue")

            const newDialoguePrompt = makeDialogueGenerateObj.current.prompt
            const newDialogueBaseInstructions = makeDialogueGenerateObj.current.baseInstructions

            //loading
            makeDialogueGenerateObj.current.loading = true

            //get scenes referenced for context
            const referencedScenes = getReferencedScenes(referencedSceneIds)

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(newDialogueBaseInstructions, { activeCharacterAppearance: scene.activeCharacterAppearance, referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions })
            const madeDialogue = await makeDialogue(newDialoguePrompt, finalBaseInstructions)

            //add the dialogue
            project.current.scenes = project.current.scenes.map(eachScene => {
                if (eachScene.id === scene.id) {
                    eachScene.dialogue = [
                        ...eachScene.dialogue.slice(0, addingDialogueIndex.current), //before
                        ...madeDialogue,
                        ...eachScene.dialogue.slice(addingDialogueIndex.current), //after
                    ]
                }

                return eachScene
            })

            //finished loading
            makeDialogueGenerateObj.current.loading = false

            //refresh
            refreshProject(["scenes"])

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <div key={scene.id} className={`container ${styles.showOnHoverParent}`} style={{ backgroundColor: "var(--bg2)", padding: "var(--spacingR)", overflow: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--spacingS)", }}>
                <button
                    onClick={() => {
                        toast.success("copied scene id")
                        navigator.clipboard.writeText(scene.id);
                    }}
                >
                    <span className="material-symbols-outlined">
                        content_copy
                    </span>
                </button>

                <div className={styles.showOnHoverChild} style={{ display: "flex", paddingInline: "var(--spacingS)", alignItems: "center" }}>
                    <button
                        onClick={() => {
                            changeSceneIndex("prev")
                        }}
                    >
                        <span className="material-symbols-outlined">
                            chevron_backward
                        </span>
                    </button>

                    <TextInput
                        name={`scene${scene.id}IndexChange`}
                        value={`${wantedNewSceneIndex.current + 1}`}
                        className="smallInput"
                        onChange={(e) => {
                            let seenNum = parseInt(e.target.value)
                            if (isNaN(seenNum)) return

                            wantedNewSceneIndex.current = seenNum - 1

                            //general refresh
                            refreshProject([])
                        }}
                    />

                    {wantedNewSceneIndex.current !== sceneIndex && (
                        <button
                            onClick={() => {
                                changeSceneIndex(wantedNewSceneIndex.current)
                            }}
                        >
                            <span className="material-symbols-outlined">
                                keyboard_control_key
                            </span>
                        </button>
                    )}

                    <button
                        onClick={() => {
                            changeSceneIndex("next")
                        }}
                    >
                        <span className="material-symbols-outlined">
                            chevron_forward
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            addingSceneIndex.current = sceneIndex + 1

                            //general refresh
                            refreshProject([])
                        }}
                    >
                        <span className="material-symbols-outlined">
                            add
                        </span>
                    </button>
                </div>

                <ConfirmationBox text='' confirmationText='Are you sure you want to delete this scene?' successMessage='scene deleted!' iconName={"delete"} float={true}
                    runAction={async () => {
                        //clean up attached background images
                        await deleteSceneBackgroundImage(project.current.id, scene.id)

                        project.current.scenes = project.current.scenes.filter(eachSceneFilter => eachSceneFilter.id !== scene.id)

                        refreshProject(["scenes"])
                    }}
                />
            </div>

            <ShowMore
                label="alter scene"
                content={(
                    <div className="container">
                        {seenAlterScenesObj === undefined ? (
                            <>
                                <button className="button1"
                                    onClick={() => {
                                        project.current.alterScenesObj[scene.id] = makeDefaultAlterScenesObj()

                                        refreshProject(["alterScenesObj"])
                                    }}
                                >make</button>
                            </>
                        ) : (
                            <>
                                <ShowMore
                                    label="baseInstructions"
                                    content={
                                        <TextArea
                                            name="sceneBaseInstructions"
                                            value={seenAlterScenesObj.baseInstructions}
                                            placeHolder="Set the base instructions for this prompt"
                                            onChange={(e) => {
                                                if (project.current.alterScenesObj[scene.id] === undefined) return

                                                project.current.alterScenesObj[scene.id].baseInstructions = e.target.value

                                                //refresh
                                                refreshProject(["alterScenesObj"])
                                            }}
                                            onBlur={() => checkProjectErrors(project.current)}
                                            errors={projectFormErrors[`alterScenesObj/${scene.id}/baseInstructions`]}
                                        />
                                    }
                                />

                                <ShowMore
                                    label="prompt"
                                    content={
                                        <TextArea
                                            name="alterScenePrompt"
                                            value={seenAlterScenesObj.prompt}
                                            placeHolder="How would you like to alter this scene..."
                                            onChange={(e) => {
                                                if (project.current.alterScenesObj[scene.id] === undefined) return

                                                project.current.alterScenesObj[scene.id].prompt = e.target.value

                                                //refresh
                                                refreshProject(["alterScenesObj"])
                                            }}
                                            onBlur={() => checkProjectErrors(project.current)}
                                            errors={projectFormErrors[`alterScenesObj/${scene.id}/prompt`]}
                                        />
                                    }
                                />

                                <ShowMore
                                    label="referenced scene id's"
                                    content={
                                        <TextInput
                                            name="alterSceneReferencedScenes"
                                            value={seenAlterScenesObj.referencedScenes}
                                            placeHolder="Enter other scene id's. e.g ID1, ID2"
                                            onChange={(e) => {
                                                if (project.current.alterScenesObj[scene.id] === undefined) return

                                                project.current.alterScenesObj[scene.id].referencedScenes = e.target.value

                                                //refresh
                                                refreshProject(["alterScenesObj"])
                                            }}
                                            onBlur={() => checkProjectErrors(project.current)}
                                            errors={projectFormErrors[`alterScenesObj/${scene.id}/referencedScenes`]}
                                        />
                                    }
                                />
                                <button
                                    onClick={() => {
                                        handleAlterScene(scene, seenAlterScenesObj.referencedScenes)
                                    }}
                                    disabled={seenAlterScenesObj.loading}
                                    className="button1"
                                >
                                    {seenAlterScenesObj.loading ? "loading..." : "alter scene"}
                                </button>

                                {seenAlterScenesObj.variations.length > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingS)" }}>
                                        <button className="button2"
                                            onClick={() => {
                                                handleSceneVariationSwitch(scene.id, "prev")
                                            }}
                                        >prev</button>

                                        <button className="button2"
                                            onClick={() => {
                                                handleSceneVariationSwitch(scene.id, "next")
                                            }}
                                        >next</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            />

            <label>scene title</label>

            <TextInput
                name={`scene${scene.id}Title`}
                value={scene.title}
                placeHolder="Set the scene title"
                onChange={(e) => {
                    project.current.scenes = project.current.scenes.map(eachScene => {
                        if (eachScene.id === scene.id) {
                            eachScene.title = e.target.value
                        }

                        return eachScene
                    })

                    //refresh
                    refreshProject(["scenes"])
                }}
                onBlur={() => checkProjectErrors(project.current)}
                errors={projectFormErrors[`scenes/${sceneIndex}/title`]}
            />

            <label>background image</label>

            {scene.backgroundImageSrc !== "" ? (
                <>
                    <ConfirmationBox text='' confirmationText='Are you sure you want to delete this background image?' successMessage='image deleted!' iconName={"delete"}
                        runAction={async () => {
                            try {
                                //delete image from folder
                                await deleteSceneBackgroundImage(project.current.id, scene.backgroundImageSrc)

                                //reset to empty
                                project.current.scenes = project.current.scenes.map(eachScene => {
                                    if (eachScene.id === scene.id) {
                                        eachScene.backgroundImageSrc = ""
                                    }

                                    return eachScene
                                })

                                refreshProject(["scenes"])

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    />

                    <Image alt={`scene${scene.id}backgroundImage`} src={`/api/projects/images/download?projectId=${project.current.id}&src=${scene.backgroundImageSrc}`} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />
                </>
            ) : (
                <>
                    <button className='button1' style={{ justifySelf: "flex-start" }}>
                        <label htmlFor={`backgroundImageUpload${scene.id}`} style={{ cursor: "pointer" }}>
                            upload
                        </label>
                    </button>

                    <input id={`backgroundImageUpload${scene.id}`} type="file" placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
                        onChange={async (e) => {
                            try {
                                if (!e.target.files) return

                                let totalUploadSize = 0
                                const uploadedFiles = e.target.files

                                const file = uploadedFiles[0];

                                //validation
                                if (!allowedImageFileTypes.includes(file.type)) {
                                    toast.error(`File ${file.name} is not a valid file type to upload.`);
                                    return
                                }

                                // Check the file size
                                if (file.size > maxFileUploadSize) {
                                    toast.error(`File ${file.name} is too large. Maximum size is ${convertBtyes(maxFileUploadSize, "mb")} MB`);
                                    return
                                }

                                //add file size to totalUploadSize
                                totalUploadSize += file.size
                                if (totalUploadSize > maxBodyToServerSize) {
                                    toast.error(`Please upload less than ${convertBtyes(maxBodyToServerSize, "mb")} MB at a time`);
                                    return
                                }

                                const fileEnding = file.name.split(".")[1]
                                const fileSrc = `${scene.id}____${uuidV4()}.${fileEnding}`

                                //add to formData
                                const formData = new FormData();
                                formData.append(fileSrc, file);

                                //set formData info
                                formData.append("projectId", project.current.id)

                                const response = await fetch(`/api/projects/images/upload`, {
                                    method: 'POST',
                                    body: formData,
                                })
                                //get the srcs of files uploaded - confirmation
                                const seenNamesObj = await response.json()

                                //validate
                                const validatedUploadFileApiResponse = uploadFileApiResponseSchema.parse(seenNamesObj)
                                const addedImageId = validatedUploadFileApiResponse.names[0]

                                project.current.scenes = project.current.scenes.map(eachScene => {
                                    if (eachScene.id === scene.id) {
                                        //react refresh
                                        eachScene = { ...eachScene }

                                        eachScene.backgroundImageSrc = addedImageId
                                    }

                                    return eachScene
                                })

                                //refresh
                                refreshProject(["scenes"])

                            } catch (error) {
                                consoleAndToastError(error)
                            }
                        }}
                    />
                </>
            )}

            <label>visual instructions</label>

            <TextInput
                name={`scene${scene.id}VisualInstructions`}
                value={scene.visualInstructions}
                placeHolder="E.g Character A was speaking to B"
                onChange={(e) => {
                    project.current.scenes = project.current.scenes.map(eachScene => {
                        if (eachScene.id === scene.id) {
                            eachScene.visualInstructions = e.target.value
                        }

                        return eachScene
                    })

                    //refresh
                    refreshProject(["scenes"])
                }}
                onBlur={() => checkProjectErrors(project.current)}
                errors={projectFormErrors[`scenes/${sceneIndex}/visualInstructions`]}
            />

            <ShowMore
                label="active character appearances"
                content={(
                    <div className="container">
                        <div className="container">
                            {Object.entries(scene.activeCharacterAppearance).map(eachEntry => {
                                const eachKey = eachEntry[0] //character id
                                const eachValue = eachEntry[1] //appearances id

                                const foundCharacter: characterType | undefined = charactersInProject.find(eachCharacterInProject => eachCharacterInProject.id === eachKey)
                                const foundAppearance: characterAppearanceType | undefined = foundCharacter !== undefined ? foundCharacter.appearances.find(eachAppearance => eachAppearance.id === eachValue) : undefined

                                return (
                                    <div key={eachKey} style={{ display: "flex", alignItems: "center", gap: "var(--spacingR)" }}>
                                        {/* <del */}

                                        {foundCharacter !== undefined && (
                                            <>
                                                <p>{foundCharacter.name}</p>

                                                {foundAppearance !== undefined ? (
                                                    <>
                                                        <Select
                                                            name={`${scene.id}ActiveCharacterAppearance`}
                                                            value={foundAppearance.name}
                                                            valueOptions={foundCharacter.appearances.map(eachAppearance => eachAppearance.name)}
                                                            onChange={value => {
                                                                project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                                                    if (eachSceneMap.id === scene.id) {
                                                                        //react refresh
                                                                        eachSceneMap = { ...eachSceneMap }
                                                                        eachSceneMap.activeCharacterAppearance = { ...eachSceneMap.activeCharacterAppearance }

                                                                        const activeAppearance: characterAppearanceType | undefined = foundCharacter.appearances.find(eachAppearance => eachAppearance.name === value)
                                                                        if (activeAppearance === undefined) throw new Error("not seeing activeAppearance from name")

                                                                        eachSceneMap.activeCharacterAppearance[eachKey] = activeAppearance.id
                                                                    }

                                                                    return eachSceneMap
                                                                })

                                                                //refresh
                                                                refreshProject(["scenes"])
                                                            }}
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="container">
                                                        <p>not seeing active appearances selection for character</p>

                                                        <button className="button2"
                                                            onClick={() => {
                                                                project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                                                    if (eachSceneMap.id === scene.id) {
                                                                        //react refresh
                                                                        eachSceneMap = { ...eachSceneMap }
                                                                        eachSceneMap.activeCharacterAppearance = { ...eachSceneMap.activeCharacterAppearance }

                                                                        const foundCharacter = charactersInProject.find(eachCharacterInProject => eachCharacterInProject.id === eachKey)
                                                                        if (foundCharacter === undefined) throw new Error("not seeing character")

                                                                        //set first in appearances array as default
                                                                        eachSceneMap.activeCharacterAppearance[eachKey] = foundCharacter.appearances[0].id
                                                                    }

                                                                    return eachSceneMap
                                                                })

                                                                //refresh
                                                                refreshProject(["scenes"])
                                                            }}
                                                        >reset</button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {Object.entries(scene.activeCharacterAppearance).length !== charactersInProject.length && (
                            <button className="button1"
                                onClick={() => {
                                    const newActiveCharacterAppearancePre = charactersInProject.map(eachCharacterInProject => {
                                        if (scene.activeCharacterAppearance === undefined) return null

                                        if (scene.activeCharacterAppearance[eachCharacterInProject.id] === undefined) {

                                            //add first time
                                            return [eachCharacterInProject.id, eachCharacterInProject.appearances[0].id]

                                        } else {
                                            //seeing already so just return original
                                            return [eachCharacterInProject.id, scene.activeCharacterAppearance[eachCharacterInProject.id]]
                                        }
                                    })
                                    const newActiveCharacterAppearance: sceneType["activeCharacterAppearance"] = Object.fromEntries(newActiveCharacterAppearancePre.filter(eachEntryArr => eachEntryArr !== null))

                                    project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                        if (eachSceneMap.id === scene.id) {
                                            //react refresh
                                            eachSceneMap = { ...eachSceneMap }
                                            eachSceneMap.activeCharacterAppearance = { ...newActiveCharacterAppearance }
                                        }

                                        return eachSceneMap
                                    })

                                    //refresh
                                    refreshProject(["scenes"])
                                }}
                            >Add appearances</button>
                        )}
                    </div>
                )}
            />

            <div className="container">
                {scene.dialogue.length > 0 ? (
                    <>
                        {scene.dialogue.map((eachDialogue, eachDialogueIndex) => {
                            const foundCharacter = charactersInProject.find(eachCharacter => eachCharacter.id === eachDialogue.characterId)

                            return (//scene edit dialogue
                                <div key={eachDialogue.id} className="container" style={{ position: "relative" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingS)", justifyContent: "flex-end" }}>
                                        <button className="button2"
                                            onClick={() => {
                                                addingDialogueIndex.current = addingDialogueIndex.current === undefined ? eachDialogueIndex + 1 : undefined

                                                //general refresh
                                                refreshProject([])
                                            }}
                                        >
                                            <span className="material-symbols-outlined">
                                                {addingDialogueIndex.current === undefined ? "add" : "check_indeterminate_small"}
                                            </span>
                                        </button>

                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <button
                                                onClick={() => { //dialogue swap setting
                                                    changeDialogueIndex(eachDialogueIndex, "prev")
                                                }}
                                            >
                                                <span className="material-symbols-outlined">
                                                    arrow_drop_up
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    changeDialogueIndex(eachDialogueIndex, "next")
                                                }}
                                            >
                                                <span className="material-symbols-outlined">
                                                    arrow_drop_down
                                                </span>
                                            </button>
                                        </div>

                                        <ConfirmationBox text='' confirmationText='Are you sure you want to delete this dialogue?' successMessage='dialogue deleted!' iconName={"delete"} float={true}
                                            runAction={async () => {
                                                project.current.scenes = project.current.scenes.map(eachScene => {
                                                    if (eachScene.id === scene.id) {
                                                        eachScene.dialogue = eachScene.dialogue.filter(eachDialogueFilter => eachDialogueFilter.id !== eachDialogue.id)
                                                    }

                                                    return eachScene
                                                })

                                                refreshProject(["scenes"])
                                            }}
                                        />
                                    </div>

                                    {foundCharacter !== undefined ? (
                                        <>
                                            <Select
                                                name={`${eachDialogue.id}characterId`}
                                                value={`${foundCharacter.name}____${eachDialogue.characterId}`}
                                                valueOptions={charactersInProject.map(eachCharacterInProject => `${eachCharacterInProject.name}____${eachCharacterInProject.id}`)}
                                                style={{ fontWeight: "bold" }}
                                                onChange={value => {
                                                    const usableValue = value.split("____")

                                                    updateDialogue(usableValue[1], "characterId", eachDialogue.id)
                                                }}
                                            />

                                            <TextArea
                                                name={`dialogueSentence${eachDialogue.id}`}
                                                value={eachDialogue.sentence}
                                                placeHolder="Edit the dialogue..."
                                                onChange={(e) => {
                                                    updateDialogue(e.target.value, "sentence", eachDialogue.id)
                                                }}
                                            />

                                            {foundCharacter.charactersToEmotions !== undefined ? (
                                                <>
                                                    <Select
                                                        name={`dialogueEmotion${eachDialogue.id}`}
                                                        value={eachDialogue.emotions ?? "null"}
                                                        valueOptions={["null", ...foundCharacter.charactersToEmotions.map(eachCharacterToEmotion => eachCharacterToEmotion.emotionType)]}
                                                        onChange={value => {
                                                            updateDialogue(value, "emotions", eachDialogue.id)
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <p>not seeing charactersToEmotions</p>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="container">
                                            <p>not seeing character for dialogue</p>

                                            <button className="button2"
                                                onClick={() => {
                                                    if (charactersInProject.length < 1) return

                                                    updateDialogue(charactersInProject[0].id, "characterId", eachDialogue.id)
                                                }}
                                            >pair</button>
                                        </div>
                                    )}

                                    {addingDialogueIndex.current === eachDialogueIndex + 1 && (
                                        <div className="container">
                                            <h2>Make Dialogue</h2>

                                            <ShowMore
                                                label='generate'
                                                content={
                                                    <div className="container">
                                                        <ShowMore
                                                            label="base instructions"
                                                            content={
                                                                <TextArea
                                                                    name="newDialogueBaseInstructions"
                                                                    value={makeDialogueGenerateObj.current.baseInstructions}
                                                                    placeHolder="Set the base instructions for the new dialogue."
                                                                    onChange={(e) => {
                                                                        makeDialogueGenerateObj.current.baseInstructions = e.target.value

                                                                        //general refresh
                                                                        refreshProject([])
                                                                    }}
                                                                />
                                                            }
                                                        />

                                                        <ShowMore
                                                            label="new dialogue prompt"
                                                            content={
                                                                <TextArea
                                                                    name="newDialoguePrompt"
                                                                    value={makeDialogueGenerateObj.current.prompt}
                                                                    placeHolder="Add a new dialogue based on your prompt"
                                                                    onChange={(e) => {
                                                                        makeDialogueGenerateObj.current.prompt = e.target.value

                                                                        //refresh
                                                                        refreshProject([])
                                                                    }}
                                                                />
                                                            }
                                                        />

                                                        <ShowMore
                                                            label="referenced scene id's"
                                                            content={
                                                                <TextInput
                                                                    name="newDialogueReferencedSceneIds"
                                                                    value={makeDialogueGenerateObj.current.referencedSceneIds}
                                                                    placeHolder="Enter other scene id's. e.g ID1, ID2"
                                                                    onChange={(e) => {
                                                                        makeDialogueGenerateObj.current.referencedSceneIds = e.target.value

                                                                        //general refresh
                                                                        refreshProject([])
                                                                    }}
                                                                />
                                                            }
                                                        />

                                                        <button className="button1"
                                                            onClick={() => {
                                                                handleMakeDialogue(makeDialogueGenerateObj.current.referencedSceneIds)
                                                            }}
                                                        >make</button>
                                                    </div>
                                                }
                                            />

                                            <ShowMore
                                                label='manual'
                                                content={
                                                    <div className="container">
                                                        <TextInput
                                                            name={`makeDialogueNewManualObjSentence${eachDialogue.id}`}
                                                            value={makeDialogueNewManualObj.current.sentence}
                                                            placeHolder="Set the sentence for the new dialogue."
                                                            onChange={(e) => {
                                                                makeDialogueNewManualObj.current.sentence = e.target.value

                                                                //general refresh
                                                                refreshProject([])
                                                            }}
                                                        />

                                                        <button className="button1"
                                                            onClick={() => {
                                                                //make new id
                                                                makeDialogueNewManualObj.current.id = uuidV4()

                                                                //assign same character id
                                                                makeDialogueNewManualObj.current.characterId = eachDialogue.characterId

                                                                //validation
                                                                dialogueSchema.parse(makeDialogueNewManualObj.current)

                                                                //add onto scenes dialogue
                                                                project.current.scenes = project.current.scenes.map(eachScene => {
                                                                    if (eachScene.id === scene.id) {
                                                                        eachScene.dialogue = [
                                                                            ...eachScene.dialogue.slice(0, addingDialogueIndex.current), //before
                                                                            makeDialogueNewManualObj.current,
                                                                            ...eachScene.dialogue.slice(addingDialogueIndex.current), //after
                                                                        ]
                                                                    }

                                                                    return eachScene
                                                                })

                                                                //reset
                                                                makeDialogueNewManualObj.current = { ...initialMakeDialogueNewManualObj }

                                                                //refresh
                                                                refreshProject(["scenes"])
                                                            }}
                                                        >add</button>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </>
                ) : (
                    <button className="button2"
                        onClick={() => {
                            project.current.scenes.map(eachScene => {
                                if (eachScene.id === scene.id) {
                                    eachScene.dialogue = [...eachScene.dialogue, { characterId: charactersInProject[0].id, emotions: null, id: uuidV4(), sentence: "" }]
                                }

                                return eachScene
                            })
                            //general refresh
                            refreshProject([])
                        }}
                    >
                        <span className="material-symbols-outlined">
                            {addingDialogueIndex.current === undefined ? "add" : "check_indeterminate_small"}
                        </span>
                    </button>
                )}
            </div>
        </div>
    )
}

function ViewDialogue({ dialogue, charactersInProject, }: { dialogue: dialogueType, charactersInProject: characterType[] }) {
    const foundCharacter = charactersInProject.find(eachCharacter => eachCharacter.id === dialogue.characterId)

    return (
        <div className="container">
            {foundCharacter !== undefined ? (
                <>
                    <div style={{ display: "flex", gap: "var(--spacingS)", flexWrap: "wrap" }}>
                        <b>{foundCharacter.name}</b>

                        {dialogue.emotions && (
                            <b>({dialogue.emotions})</b>
                        )}

                        <span>{dialogue.sentence} </span>
                    </div>
                </>
            ) : (
                <>
                    <p>not seeing character for dialogue</p>
                </>
            )}
        </div>
    )
}

function ShowAudio({ seenAlterDialogueObj, seenProjectId }: { seenAlterDialogueObj: alterDialogueObjType["key"], seenProjectId: projectType["id"] }) {
    return (
        <div key={seenAlterDialogueObj.variationIndex} style={{ display: "flex", gap: "var(--spacingS)", alignItems: "center" }}>
            <audio controls>
                <source src={`/api/audio/view?projectId=${seenProjectId}&fileName=${seenAlterDialogueObj.audioFileNameArray[seenAlterDialogueObj.variationIndex]}`} type="audio/mpeg" />
            </audio>

            {seenAlterDialogueObj.variationIndex !== 0 && (
                <p>v{seenAlterDialogueObj.variationIndex + 1}</p>
            )}
        </div>
    )
}