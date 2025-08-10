"use client"
import ShowMore from "@/components/showMore/ShowMore"
import { alterScene, makeDialogue, makeScenes, makeStory } from "@/serverFunctions/handleGpt"
import { refreshProjectPath, updateProject } from "@/serverFunctions/handleProjects"
import { activeCharacterClothingType, alterDialogueObjType, alterScenesObjType, characterType, clothingType, dialogueSchema, dialogueType, downloadProjectBodySchema, downloadProjectBodyType, makeAudioBodySchema, makeAudioBodyType, makeAudioResponseSchema, projectSchema, projectType, sceneSchema, sceneType, searchObjType, updateProjectSchema } from "@/types"
import { consoleAndToastError } from "@/useful/consoleErrorWithToast"
import Image from "next/image"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import defaultImg from "@/public/default.jpg"
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

//how does gpt api work...
//how does eleven labs api work - multi/single tts...
//how does after effects integration work - layers, importing, images, audio

type editModeType = {
    scenes: boolean;
}

export default function ViewProject({ seenProject }: { seenProject: projectType }) {
    const { rateLimit } = UseRateLimit({})
    const project = useRef<projectType>({ ...seenProject })
    const charactersInProject = project.current.charactersToProjects !== undefined ? project.current.charactersToProjects.map(eachCharacterToProject => eachCharacterToProject.character).filter(each => each !== undefined) : []
    const [projectFormErrors, projectFormErrorsSet] = useState<{ [key: string]: string | undefined }>({})

    const projectSaveDebounce = useRef<{ [key: string]: NodeJS.Timeout | undefined }>({})
    const storyLoading = useRef(false)

    const [projectRefresher, projectRefresherSet] = useState<{ [key in keyof projectType]?: boolean }>({})
    const refreshFromServer = useRef(false)

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
        baseInstructions: `BaseInstructions:\n[[baseInstructions]]\n\n\nPlease add a new scene/scenes based on the user prompt\n\n\nYou can use these scenes for reference context if needed.\n[[referencedScenes]]`,
        referencedSceneIds: "",
        loading: false
    })
    const initialMakeScenesNewManualObj: sceneType = {
        id: "",
        title: "",
        dialogue: [],
        backgroundImageSrc: null,
        activeCharacterClothing: {}
    }
    const makeScenesNewManualObj = useRef<sceneType>({ ...initialMakeScenesNewManualObj })

    const editMode = useRef<editModeType>({
        scenes: false
    })
    const addingSceneIndex = useRef<number | undefined>(undefined)

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

    async function handleProjectSave(latestProject: Partial<projectType>, specificKeys: (keyof projectType)[] = []) {
        const debounceKey = specificKeys.length > 0 ? specificKeys.join(",") : "default"
        if (projectSaveDebounce.current[debounceKey]) clearTimeout(projectSaveDebounce.current[debounceKey])

        //send off one batch update
        projectSaveDebounce.current[debounceKey] = setTimeout(async () => {
            try {
                const pickShape = Object.fromEntries(
                    specificKeys.map(key => [key, true])
                ) as { [K in keyof typeof updateProjectSchema.shape]?: true };

                checkProjectErrors(latestProject)
                const validatedProject = specificKeys.length > 0 ? updateProjectSchema.pick(pickShape).parse(latestProject) : updateProjectSchema.parse(latestProject)

                console.log(`$sending to server update`, validatedProject);

                //send to server
                await updateProject(seenProject.id, validatedProject)

                console.log(`$update confirmed on server`);

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
            //ensure chracters and activeCharacterClothingStarter
            if (charactersInProject.length < 1) throw new Error("please add characters to this project generate a story")

            //loading
            storyLoading.current = true
            project.current.scenes = []

            toast.success("Generating story...")

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(project.current.baseInstructions, { activeCharacterClothing: project.current.activeCharacterClothingStarter })
            const madeScenes = await makeStory(project.current.prompt, finalBaseInstructions, project.current.activeCharacterClothingStarter)

            //add scenes
            project.current.scenes = madeScenes

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
            const finalBaseInstructions = addVariablesToBaseInstructions(newSceneBaseInstructions, { referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions })
            const madeScenes = await makeScenes(newScenePrompt, finalBaseInstructions, project.current.activeCharacterClothingStarter)

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


    function addVariablesToBaseInstructions(seenBaseInstructions: string, variables?: { scene?: sceneType, referencedScenes?: sceneType[], baseInstructions?: string, activeCharacterClothing?: activeCharacterClothingType }, atTop = true) {
        //add on characters
        seenBaseInstructions = seenBaseInstructions.replaceAll("[[characters]]", JSON.stringify(charactersInProject, null, 2))

        if (variables !== undefined) {
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
                    seenBaseInstructions = seenBaseInstructions.replaceAll("[[baseInstructions]]", addVariablesToBaseInstructions(variables.baseInstructions, variables, false))
                }
            }

            if (variables.activeCharacterClothing !== undefined) {
                //add on reference Scenes
                seenBaseInstructions = seenBaseInstructions.replaceAll("[[activeCharacterClothing]]", JSON.stringify(variables.activeCharacterClothing, null, 2))
            }
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
    async function handleDialogueAudio(eachDialogue: dialogueType, singleGeneration = true) {
        //rate limit
        rateLimit(async () => {
            await actualRun()
        })

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

                //notify loading
                if (singleGeneration) toast.success("generating!")

                //start loading
                project.current.alterDialogueObj[eachDialogue.id].loading = true

                const newMakeAudioBody: makeAudioBodyType = {
                    line: eachDialogue.sentence,
                    projectId: seenProject.id,
                    dialogueId: eachDialogue.id,
                    character: foundCharacter,
                    variationIndex: project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.length
                }
                //validation
                makeAudioBodySchema.parse(newMakeAudioBody)

                const response = await fetch(`/api/audio/make`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(newMakeAudioBody)
                })
                const makeAudioResponse = makeAudioResponseSchema.parse(await response.json())

                //add on audio fileName
                project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray = [...project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray, makeAudioResponse.dialogueAudioFileName]

                //set variation Index to latest
                project.current.alterDialogueObj[eachDialogue.id].variationIndex = project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.length - 1

                //set audioEditable to false - ensures we don't overwrite if unecessary
                project.current.alterDialogueObj[eachDialogue.id].audioEditable = false

                //finish loading
                project.current.alterDialogueObj[eachDialogue.id].loading = false

                //refresh
                refreshProject(["alterDialogueObj"])

                if (singleGeneration) toast.success("finished!")

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
                    startShowing={true}
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
                                            const seenActiveCharacterClothingId: activeCharacterClothingType["key"] = project.current.activeCharacterClothingStarter[eachCharacterInProject.id]
                                            const foundClothing: clothingType | undefined = seenActiveCharacterClothingId !== undefined ? eachCharacterInProject.clothing.find(eachClothingItem => eachClothingItem.id === seenActiveCharacterClothingId) : undefined

                                            //ensure exists for character for first time
                                            if (seenActiveCharacterClothingId === undefined) {
                                                //update activeCharacterClothingStarter
                                                project.current.activeCharacterClothingStarter[eachCharacterInProject.id] = eachCharacterInProject.clothing[0].id

                                                //refresh
                                                refreshProject(["activeCharacterClothingStarter"])
                                            }

                                            return {
                                                item: eachCharacterInProject,
                                                Element: (
                                                    <div className="container">
                                                        <ViewCharacter seenCharacter={eachCharacterInProject} viewAll={false} />

                                                        {seenActiveCharacterClothingId !== undefined && foundClothing !== undefined && (
                                                            <>
                                                                <b>Clothing start</b>

                                                                <Select
                                                                    name={`${eachCharacterInProject.id}ActiveCharacterClothingStarter`}
                                                                    value={foundClothing.name}
                                                                    valueOptions={eachCharacterInProject.clothing.map(eachClothingItem => eachClothingItem.name)}
                                                                    onChange={value => {
                                                                        const foundClothingItem: clothingType | undefined = eachCharacterInProject.clothing.find(eachClothingItem => eachClothingItem.name === value)
                                                                        if (foundClothingItem === undefined) throw new Error("not seeing foundClothingItem from name")

                                                                        project.current.activeCharacterClothingStarter[eachCharacterInProject.id] = foundClothingItem.id

                                                                        //refresh
                                                                        refreshProject(["activeCharacterClothingStarter"])
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

                <button
                    onClick={handleGenerateStory}
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
                        </div>

                        <div className="container gridColumns snap" style={{ gridAutoColumns: "min(500px, 90%)" }}>
                            {project.current.scenes.map((eachScene, eachSceneIndex) => {

                                return (
                                    <React.Fragment key={eachScene.id}>
                                        {editMode.current.scenes ? (
                                            <>
                                                <EditScene scene={eachScene} project={project} charactersInProject={charactersInProject} refreshProject={refreshProject} projectFormErrors={projectFormErrors} checkProjectErrors={checkProjectErrors} getReferencedScenes={getReferencedScenes} addVariablesToBaseInstructions={addVariablesToBaseInstructions} addingSceneIndex={addingSceneIndex} />

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

                                                                    <TextInput
                                                                        name="makeScenesNewManualObjBackgroundImg"
                                                                        value={makeScenesNewManualObj.current.backgroundImageSrc ?? ""}
                                                                        placeHolder="Set the backgroundImageSrc src for the new Scene."
                                                                        onChange={(e) => {
                                                                            const seenText = e.target.value === "" ? null : e.target.value
                                                                            makeScenesNewManualObj.current.backgroundImageSrc = seenText

                                                                            console.log(`$makeScenesNewManualObj.current.backgroundImageSrc`, makeScenesNewManualObj.current.backgroundImageSrc);
                                                                            //general refresh
                                                                            refreshProject([])
                                                                        }}
                                                                    />

                                                                    <button className="button1"
                                                                        onClick={() => {
                                                                            const newScene: sceneType = {
                                                                                ...makeScenesNewManualObj.current,
                                                                                id: uuidV4(),
                                                                                activeCharacterClothing: project.current.activeCharacterClothingStarter,
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
                                            <ViewScene scene={eachScene} charactersInProject={charactersInProject} />
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
                {project.current.scenes.length > 0 && (
                    <>
                        <h2>audio</h2>

                        <div style={{ display: "flex", justifyContent: "center", gap: "var(--spacingS)" }}>
                            <button className="button1"
                                onClick={async () => {
                                    toast.success("generating all!")

                                    await Promise.all(project.current.scenes.map(async eachScene => {
                                        return eachScene.dialogue.map(async eachDialogue => {
                                            await handleDialogueAudio(eachDialogue, false)
                                        })
                                    }))
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
                )
                }
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

function ViewScene({ scene, charactersInProject }: {
    scene: sceneType, charactersInProject: characterType[]
}) {
    return (
        <div className="container" style={{ backgroundColor: "var(--bg2)", padding: "var(--spacingR)", overflow: "auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <h3>{scene.title}</h3>
            </div>

            {scene.backgroundImageSrc !== null && (
                <Image alt={`scene_${scene.id}_Background`} src={defaultImg} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />
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

function EditScene({ scene, charactersInProject, project, refreshProject, projectFormErrors, checkProjectErrors, getReferencedScenes, addVariablesToBaseInstructions, addingSceneIndex }: {
    scene: sceneType, charactersInProject: characterType[], project: React.RefObject<projectType>, refreshProject(projectKeys: (keyof projectType)[]): void, projectFormErrors: { [key: string]: string | undefined; }, checkProjectErrors(seenFormObj: Partial<projectType>): boolean, getReferencedScenes(referencedSceneIds: string): sceneType[], addVariablesToBaseInstructions(seenBaseInstructions: string, variables?: { scene?: sceneType; referencedScenes?: sceneType[]; baseInstructions?: string, activeCharacterClothing?: activeCharacterClothingType }, atTop?: boolean): string, addingSceneIndex: React.RefObject<number | undefined>
}) {
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
            const finalBaseInstructions = addVariablesToBaseInstructions(sceneBaseInstructions, { scene: sceneToReplace, referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions, activeCharacterClothing: sceneToReplace.activeCharacterClothing })
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
            const finalBaseInstructions = addVariablesToBaseInstructions(newDialogueBaseInstructions, { referencedScenes: referencedScenes, baseInstructions: project.current.baseInstructions })
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

            <label>scene backgroundImage</label>

            <TextInput
                name={`scene${scene.id}backgroundImageSrc`}
                value={scene.backgroundImageSrc ?? ""}
                placeHolder="Set the scene backgroundImage"
                onChange={(e) => {
                    project.current.scenes = project.current.scenes.map(eachScene => {
                        if (eachScene.id === scene.id) {
                            eachScene.backgroundImageSrc = e.target.value
                        }

                        return eachScene
                    })

                    //refresh
                    refreshProject(["scenes"])
                }}
                onBlur={() => checkProjectErrors(project.current)}
                errors={projectFormErrors[`scenes/${sceneIndex}/backgroundImageSrc`]}
            />

            {scene.backgroundImageSrc !== null && (
                <Image alt={`scene${scene.id}backgroundImage`} src={defaultImg} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />
            )}

            <ShowMore
                label="active character clothing"
                content={(
                    <div className="container">
                        <div className="container">
                            {Object.entries(scene.activeCharacterClothing).map(eachEntry => {
                                const eachKey = eachEntry[0] //character id
                                const eachValue = eachEntry[1] //clothing id

                                const foundCharacter: characterType | undefined = charactersInProject.find(eachCharacterInProject => eachCharacterInProject.id === eachKey)
                                const foundClothing: clothingType | undefined = foundCharacter !== undefined ? foundCharacter.clothing.find(eachClothingItem => eachClothingItem.id === eachValue) : undefined

                                return (
                                    <div key={eachKey} style={{ display: "flex", alignItems: "center", gap: "var(--spacingR)" }}>
                                        {/* <del */}

                                        {foundCharacter !== undefined && (
                                            <>
                                                <p>{foundCharacter.name}</p>

                                                {foundClothing !== undefined ? (
                                                    <>
                                                        <Select
                                                            name={`${scene.id}ActiveCharacterClothing`}
                                                            value={foundClothing.name}
                                                            valueOptions={foundCharacter.clothing.map(eachClothingItem => eachClothingItem.name)}
                                                            onChange={value => {
                                                                project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                                                    if (eachSceneMap.id === scene.id) {
                                                                        //react refresh
                                                                        eachSceneMap = { ...eachSceneMap }
                                                                        eachSceneMap.activeCharacterClothing = { ...eachSceneMap.activeCharacterClothing }

                                                                        const foundClothingItem: clothingType | undefined = foundCharacter.clothing.find(eachClothingItem => eachClothingItem.name === value)
                                                                        if (foundClothingItem === undefined) throw new Error("not seeing foundClothingItem from name")

                                                                        eachSceneMap.activeCharacterClothing[eachKey] = foundClothingItem.id
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
                                                        <p>not seeing active clothing selection for character</p>

                                                        <button className="button2"
                                                            onClick={() => {
                                                                project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                                                    if (eachSceneMap.id === scene.id) {
                                                                        //react refresh
                                                                        eachSceneMap = { ...eachSceneMap }
                                                                        eachSceneMap.activeCharacterClothing = { ...eachSceneMap.activeCharacterClothing }

                                                                        const foundCharacter = charactersInProject.find(eachCharacterInProject => eachCharacterInProject.id === eachKey)
                                                                        if (foundCharacter === undefined) throw new Error("not seeing character")

                                                                        //set first in clothing array as default
                                                                        eachSceneMap.activeCharacterClothing[eachKey] = foundCharacter.clothing[0].id
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

                        {Object.entries(scene.activeCharacterClothing).length !== charactersInProject.length && (
                            <button className="button1"
                                onClick={() => {
                                    const newActiveCharacterClothingPre = charactersInProject.map(eachCharacterInProject => {
                                        if (scene.activeCharacterClothing === undefined) return null

                                        if (scene.activeCharacterClothing[eachCharacterInProject.id] === undefined) {

                                            //add first time
                                            return [eachCharacterInProject.id, eachCharacterInProject.clothing[0].id]

                                        } else {
                                            //seeing already so just return original
                                            return [eachCharacterInProject.id, scene.activeCharacterClothing[eachCharacterInProject.id]]
                                        }
                                    })
                                    const newActiveCharacterClothing: sceneType["activeCharacterClothing"] = Object.fromEntries(newActiveCharacterClothingPre.filter(eachEntryArr => eachEntryArr !== null))

                                    project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                        if (eachSceneMap.id === scene.id) {
                                            //react refresh
                                            eachSceneMap = { ...eachSceneMap }
                                            eachSceneMap.activeCharacterClothing = { ...newActiveCharacterClothing }
                                        }

                                        return eachSceneMap
                                    })

                                    //refresh
                                    refreshProject(["scenes"])
                                }}
                            >Add clothing</button>
                        )}
                    </div>
                )}
            />

            <div className="container">
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