"use client"
import ShowMore from "@/components/showMore/ShowMore"
import { baseInstructionsPromptFilepath } from "@/lib/dirPaths"
import { alterScene, makeScenes, makeStory } from "@/serverFunctions/handleGpt"
import { refreshProjectPath, updateProject } from "@/serverFunctions/handleProjects"
import { alterDialogueObjType, alterScenesObjType, characterSchema, characterType, dialogueType, makeAudioBodySchema, makeAudioBodyType, makeAudioResponseSchema, projectSchema, projectType, sceneSchema, sceneType, searchObjType, updateProjectSchema } from "@/types"
import { consoleAndToastError } from "@/useful/consoleErrorWithToast"
import { fetchMainFolderFile } from "@/utility/utility"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
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

export default function ViewProject({ seenProject }: { seenProject: projectType }) {
    const { rateLimit } = UseRateLimit({})
    const project = useRef<projectType>({ ...seenProject })
    const charactersInProject = project.current.charactersToProjects !== undefined ? project.current.charactersToProjects.map(eachCharacterToProject => eachCharacterToProject.character).filter(each => each !== undefined) : []
    const [projectFormErrors, projectFormErrorsSet] = useState<{ [key: string]: string | undefined }>({})

    const baseInstructions = useRef<string | undefined>(undefined)
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
    }
    const makeScenesNewManualObj = useRef<sceneType>({ ...initialMakeScenesNewManualObj })

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

    //load base instructions
    useEffect(() => {
        const loadInstructions = async () => {
            try {
                const seenText = await fetchMainFolderFile(baseInstructionsPromptFilepath, "text");
                baseInstructions.current = seenText;

                //general refresh
                refreshProject([])

            } catch (error) {
                consoleAndToastError(error);
            }
        };

        loadInstructions();
    }, []);

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
        projectSaveDebounce.current[debounceKey] = setTimeout(() => {
            try {
                const pickShape = Object.fromEntries(
                    specificKeys.map(key => [key, true])
                ) as { [K in keyof typeof updateProjectSchema.shape]?: true };

                checkProjectErrors(latestProject)
                const validatedProject = specificKeys.length > 0 ? updateProjectSchema.pick(pickShape).parse(latestProject) : updateProjectSchema.parse(latestProject)

                console.log(`$sending to server update`, validatedProject);

                //send to server
                updateProject(seenProject.id, validatedProject)

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
            if (baseInstructions.current === undefined) throw new Error("not seeing base instructions")

            //loading
            storyLoading.current = true
            project.current.scenes = []

            toast.success("Generating story...")

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(baseInstructions.current)
            const storyResponse = await makeStory(project.current.prompt, finalBaseInstructions)

            //add scenes
            project.current.scenes = storyResponse.scenes

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
            if (baseInstructions.current === undefined) throw new Error("not seeing base instructions")
            if (makeScenesGenerateObj.current.prompt === "") throw new Error("not seeing prompt")
            if (makeScenesGenerateObj.current.baseInstructions === "") throw new Error("not seeing base instructions")

            toast.success("making scenes")

            const newScenePrompt = makeScenesGenerateObj.current.prompt
            const newSceneBaseInstructions = makeScenesGenerateObj.current.baseInstructions

            //loading
            makeScenesGenerateObj.current.loading = true

            //get scenes referenced for context
            const referencedScenes = getReferencedScenes(referencedSceneIds)

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(newSceneBaseInstructions, { referencedScenes: referencedScenes, baseInstructions: baseInstructions.current })
            const makeScenesResponse = await makeScenes(newScenePrompt, finalBaseInstructions)

            //add the scenes
            project.current.scenes = [...project.current.scenes, ...makeScenesResponse.scenes]

            //finished loading
            makeScenesGenerateObj.current.loading = false

            //refresh
            refreshProject(["scenes"])

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }
    }
    async function handleAlterScene(sceneToReplace: sceneType, referencedSceneIds: string) {
        try {
            if (baseInstructions.current === undefined) throw new Error("not seeing base instructions")
            if (project.current.alterScenesObj[sceneToReplace.id] === undefined) throw new Error("not seeing scene to replace")

            toast.success("altering scene")

            const scenePrompt = project.current.alterScenesObj[sceneToReplace.id].prompt
            const sceneBaseInstructions = project.current.alterScenesObj[sceneToReplace.id].baseInstructions

            //loading
            project.current.alterScenesObj[sceneToReplace.id].loading = true

            //get scenes referenced for context
            const referencedScenes = getReferencedScenes(referencedSceneIds)

            //get variables into prompt
            const finalBaseInstructions = addVariablesToBaseInstructions(sceneBaseInstructions, { scene: sceneToReplace, referencedScenes: referencedScenes, baseInstructions: baseInstructions.current })
            const newAlteredSceneResponse = await alterScene(scenePrompt, finalBaseInstructions, sceneToReplace)

            const newReplacedScene = { ...newAlteredSceneResponse.scene, id: sceneToReplace.id }

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

    function addVariablesToBaseInstructions(seenBaseInstructions: string, variables?: { scene?: sceneType, referencedScenes?: sceneType[], baseInstructions?: string }, atTop = true) {
        //add on characters
        seenBaseInstructions = seenBaseInstructions.replaceAll("[[characters]]", JSON.stringify(charactersInProject, null, 2))

        if (variables !== undefined) {
            if (variables.scene !== undefined) {
                //add on scene
                seenBaseInstructions = seenBaseInstructions.replaceAll("[[scene]]", JSON.stringify(variables.scene, null, 2))
            }

            if (variables.referencedScenes !== undefined) {
                console.log(`$seen re`);
                //add on reference Scenes
                if (variables.referencedScenes.length > 0) {
                    seenBaseInstructions = seenBaseInstructions.replaceAll("[[referencedScenes]]", JSON.stringify(variables.referencedScenes, null, 2))
                }
            }

            if (variables.baseInstructions !== undefined) {
                //prevent loop
                if (atTop) {
                    console.log(`$called here`);
                    //add on baseInstructions
                    seenBaseInstructions = seenBaseInstructions.replaceAll("[[baseInstructions]]", addVariablesToBaseInstructions(variables.baseInstructions, variables, false))
                }
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
                project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.push(makeAudioResponse.dialogueAudioFileName)

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

    const seeingFixed = Object.entries(project.current.alterDialogueObj).filter(eachEntry => !eachEntry[1].audioEditable).length > 0

    return (
        <main className={styles.main}>
            <section>
                <ShowMore
                    label='characters'
                    startShowing={true}
                    content={(
                        <div className='container'>
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
                />

                <h2>Story Prompt</h2>

                <ShowMore
                    label='general behaviour'
                    content={
                        <TextArea
                            name="baseInstructions"
                            value={baseInstructions.current !== undefined ? baseInstructions.current : ""}
                            placeHolder="Describe how the gpt works..."
                            onChange={(e) => {
                                baseInstructions.current = e.target.value

                                //general refresh
                                refreshProject([])
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
                        <h2>scenes</h2>

                        <div className="container gridColumns snap" style={{ gridAutoColumns: "min(500px, 90%)" }}>
                            {project.current.scenes.map((eachScene, eachSceneIndex) => {
                                const seenAlterScenesObj: alterScenesObjType["key"] | undefined = project.current.alterScenesObj[eachScene.id]

                                return (
                                    <div key={eachScene.id} className="container" style={{ backgroundColor: "var(--bg2)", padding: "var(--spacingR)", overflow: "auto", position: "relative" }}>
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <h3>{eachScene.title}</h3>

                                            <button style={{ marginLeft: "auto" }}
                                                onClick={() => {
                                                    toast.success("copied scene id")
                                                    navigator.clipboard.writeText(eachScene.id);
                                                }}
                                            >
                                                <span className="material-symbols-outlined">
                                                    content_copy
                                                </span>
                                            </button>

                                            <ConfirmationBox text='' confirmationText='are you sure you want to delete this scene?' successMessage='scene deleted!' iconName={"delete"} float={true}
                                                runAction={async () => {
                                                    project.current.scenes = project.current.scenes.filter(eachSceneFilter => eachSceneFilter.id !== eachScene.id)

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
                                                                    project.current.alterScenesObj[eachScene.id] = makeDefaultAlterScenesObj()

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
                                                                            if (project.current.alterScenesObj[eachScene.id] === undefined) return

                                                                            project.current.alterScenesObj[eachScene.id].baseInstructions = e.target.value

                                                                            //refresh
                                                                            refreshProject(["alterScenesObj"])
                                                                        }}
                                                                        onBlur={() => checkProjectErrors(project.current)}
                                                                        errors={projectFormErrors[`alterScenesObj/${eachScene.id}/baseInstructions`]}
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
                                                                            if (project.current.alterScenesObj[eachScene.id] === undefined) return

                                                                            project.current.alterScenesObj[eachScene.id].prompt = e.target.value

                                                                            //refresh
                                                                            refreshProject(["alterScenesObj"])
                                                                        }}
                                                                        onBlur={() => checkProjectErrors(project.current)}
                                                                        errors={projectFormErrors[`alterScenesObj/${eachScene.id}/prompt`]}
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
                                                                            if (project.current.alterScenesObj[eachScene.id] === undefined) return

                                                                            project.current.alterScenesObj[eachScene.id].referencedScenes = e.target.value

                                                                            //refresh
                                                                            refreshProject(["alterScenesObj"])
                                                                        }}
                                                                        onBlur={() => checkProjectErrors(project.current)}
                                                                        errors={projectFormErrors[`alterScenesObj/${eachScene.id}/referencedScenes`]}
                                                                    />
                                                                }
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    handleAlterScene(eachScene, seenAlterScenesObj.referencedScenes)
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
                                                                            handleSceneVariationSwitch(eachScene.id, "prev")
                                                                        }}
                                                                    >prev</button>

                                                                    <button className="button2"
                                                                        onClick={() => {
                                                                            handleSceneVariationSwitch(eachScene.id, "next")
                                                                        }}
                                                                    >next</button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        />

                                        {eachScene.backgroundImageSrc !== null && (
                                            <Image alt={`Scene ${eachSceneIndex + 1} Background`} src={defaultImg} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />
                                        )}

                                        <div className="container">
                                            {eachScene.dialogue.map(eachDialogue => {
                                                return (
                                                    <DisplayDialogue key={eachDialogue.id} dialogue={eachDialogue} usedCharacters={charactersInProject} editMode={true}
                                                        updateDialogue={(seenText, seenKey) => {
                                                            project.current.scenes = project.current.scenes.map(eachSceneMap => {
                                                                if (eachSceneMap.id === eachScene.id) {
                                                                    eachSceneMap.dialogue = eachSceneMap.dialogue.map(eachDialogueMap => {
                                                                        if (eachDialogueMap.id === eachDialogue.id) {
                                                                            if (seenKey === "sentence") {
                                                                                eachDialogueMap.sentence = seenText

                                                                            } else if (seenKey === "emotions") {
                                                                                eachDialogueMap.emotions = seenText
                                                                            }

                                                                            //make audio editable since dialogue changed
                                                                            const seenAlterDialogueObj: alterDialogueObjType["key"] | undefined = project.current.alterDialogueObj[eachDialogue.id]
                                                                            if (seenAlterDialogueObj !== undefined) {
                                                                                project.current.alterDialogueObj[eachDialogue.id].audioEditable = true
                                                                            }
                                                                        }

                                                                        return eachDialogueMap
                                                                    })
                                                                }

                                                                return eachSceneMap
                                                            })

                                                            refreshProject(["scenes"])
                                                        }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="container">
                                <h2>Make scenes</h2>

                                <ShowMore
                                    label='generate'
                                    content={
                                        <div className="container">
                                            <ShowMore
                                                label="base instructions"
                                                content={
                                                    <TextArea
                                                        name="newSceneBaseInstructions"
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
                                                        name="newScenePrompt"
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
                                                        name="newSceneReferencedSceneIds"
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
                                    startShowing={true}
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
                                                        id: uuidV4(),
                                                        dialogue: [],
                                                        title: makeScenesNewManualObj.current.title,
                                                        backgroundImageSrc: makeScenesNewManualObj.current.backgroundImageSrc,
                                                    }

                                                    //validation
                                                    sceneSchema.parse(newScene)

                                                    //add onto scenes
                                                    project.current.scenes = [...project.current.scenes, newScene]

                                                    //reset
                                                    makeScenesNewManualObj.current = { ...initialMakeScenesNewManualObj }

                                                    //general refresh
                                                    refreshProject([])
                                                }}
                                            >add</button>
                                        </div>
                                    }
                                />
                            </div>
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
                                                <div key={eachDialogue.id} className="container">
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

                                                            <DisplayDialogue dialogue={eachDialogue} usedCharacters={charactersInProject} />

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

            </section>
        </main>
    )
}

function DisplayDialogue({ dialogue, usedCharacters, editMode = false, updateDialogue }: { dialogue: dialogueType, usedCharacters: characterType[], editMode?: boolean, updateDialogue?: (text: string, key: keyof dialogueType) => void }) {
    const foundCharacter = usedCharacters.find(eachCharacter => eachCharacter.id === dialogue.characterId)

    return (
        <div className="container">
            {foundCharacter !== undefined ? (
                <>
                    <b>{foundCharacter.name}</b>

                    <TextArea
                        name={`dialogueText_${dialogue.id}`}
                        value={dialogue.sentence}
                        placeHolder="Edit the dialogue..."
                        onChange={(e) => {
                            if (!editMode || updateDialogue === undefined) return

                            updateDialogue(e.target.value, "sentence")
                        }}
                    />

                    {editMode ? (
                        <>
                            {foundCharacter.charactersToEmotions !== undefined ? (
                                <>
                                    <Select
                                        name={`dialogueEmotion_${dialogue.id}`}
                                        value={dialogue.emotions !== null ? dialogue.emotions : ""}
                                        valueOptions={foundCharacter.charactersToEmotions.map(eachCharacterToEmotion => eachCharacterToEmotion.emotionType)}
                                        onChange={value => {
                                            if (updateDialogue === undefined) return

                                            updateDialogue(value, "emotions")
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
                        <>
                            {dialogue.emotions && (
                                <b>({dialogue.emotions})</b>
                            )}
                        </>
                    )}

                </>
            ) : (
                <>
                    <p>not seeing character for dialogue</p>

                    <button>pair character</button>
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