"use client"
import ShowMore from "@/components/showMore/ShowMore"
import { baseInstructionsPromptFilepath } from "@/lib/dirPaths"
import { alterScene, makeStory } from "@/serverFunctions/handleGpt"
import { refreshProjectPath, updateProject } from "@/serverFunctions/handleProjects"
import { alterDialogueObjType, alterScenesObjType, characterType, dialogueType, makeAudioBodySchema, makeAudioBodyType, makeAudioResponseSchema, projectSchema, projectType, sceneType, searchObjType, updateProjectSchema } from "@/types"
import { consoleAndToastError } from "@/useful/consoleErrorWithToast"
import { condenseIntoPrompt, fetchMainFolderFile } from "@/utility/utility"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import defaultImg from "@/public/default.jpg"
import Search from "../search/Search"
import { getCharacters } from "@/serverFunctions/handleCharacters"
import ViewCharacter from "../characters/ViewCharacter"
import styles from "./style.module.css"
import ViewItems from "../items/ViewItem"
import { addCharacterToProject, deleteCharacterInProject, getSpecificCharacterInProject } from "@/serverFunctions/handleCharactersToProjects"
import TextArea from "../inputs/textArea/TextArea"
import TextInput from "../inputs/textInput/TextInput"

//how does gpt api work...
//how does eleven labs api work - multi/single tts...
//how does after effects integration work - layers, importing, images, audio

export default function ViewProject({ seenProject }: { seenProject: projectType }) {
    const project = useRef<projectType>({ ...seenProject })
    const charactersInProject = project.current.charactersToProjects !== undefined ? project.current.charactersToProjects.map(eachCharacterToProject => eachCharacterToProject.character).filter(each => each !== undefined) : []
    const [projectFormErrors, projectFormErrorsSet] = useState<{ [key: string]: string | undefined }>({})

    const baseInstructions = useRef<string | undefined>(undefined)
    const projectSaveDebounce = useRef<{ [key: string]: NodeJS.Timeout | undefined }>({})
    const storyLoading = useRef(false)

    const [projectRefresher, projectRefresherSet] = useState<{ [key in keyof projectType]?: boolean }>({})

    const [charactersSearchObj, charactersSearchObjSet] = useState<searchObjType<characterType>>({
        searchItems: [],
    })

    //handle changes from above
    useEffect(() => {
        project.current = { ...seenProject }
        console.log(`$ran server change use effect`);

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

                console.log(`$validated project`, validatedProject);

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

            const finalPrompt = condenseIntoPrompt({ prompt: project.current.prompt, characters: charactersInProject })
            console.log(`$finalPrompt`, finalPrompt);
            const storyResponse = await makeStory(finalPrompt, baseInstructions.current)

            project.current.scenes = storyResponse.scenes

            //refresh
            refreshProject(["scenes"])

        } catch (error) {
            consoleAndToastError(error)

        } finally {
            storyLoading.current = false

        }
    }

    async function handleAlterScene(scenePrompt: string, sceneToReplace: sceneType, referencedSceneIds: string) {
        try {
            if (baseInstructions.current === undefined) throw new Error("not seeing base instructions")
            if (project.current.alterScenesObj[sceneToReplace.id] === undefined) throw new Error("not seeing scene to replace")

            //loading
            project.current.alterScenesObj[sceneToReplace.id].loading = true

            //get scenes referenced for context
            const referencedScenesIdArr: sceneType["id"][] = referencedSceneIds !== "" ? referencedSceneIds.split(",") : []

            const referenceScenes = referencedScenesIdArr.map(eachReferenceId => {
                const foundScene = project.current.scenes.find(eachScene => eachScene.id === eachReferenceId.trim())
                if (foundScene === undefined) throw new Error("not seeing scene with id specified")
                return foundScene
            })

            const finalPrompt = condenseIntoPrompt({ prompt: scenePrompt, characters: charactersInProject })
            const newAlteredSceneResponse = await alterScene(finalPrompt, baseInstructions.current, sceneToReplace, referenceScenes)

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

        } catch (error) {
            consoleAndToastError(error)
        }
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
            prompt: "",
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
    }

    function makeDefaultAlterDialogueObj(): alterDialogueObjType["key"] {
        return {
            loading: false,
            audioFileNameArray: [],
            variationIndex: 0
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
    }
    async function handleDialogueAudio(eachDialogue: dialogueType, singleGeneration = true) {
        try {
            if (singleGeneration) toast.success("generating!")

            const foundCharacter = charactersInProject.find(eachCharacter => eachCharacter.id === eachDialogue.characterId)
            if (foundCharacter === undefined) throw new Error("not seeing character for dialogue id")

            //audio made for every dialogue line
            //audip received for each dialogue line

            //start alterFialogueObj
            if (project.current.alterDialogueObj[eachDialogue.id] === undefined) {
                project.current.alterDialogueObj[eachDialogue.id] = makeDefaultAlterDialogueObj()
            }

            //start loading
            project.current.alterDialogueObj[eachDialogue.id].loading = true

            const newMakeAudioBody: makeAudioBodyType = {
                line: eachDialogue.sentence,
                projectId: seenProject.id,
                dialogueId: eachDialogue.id,
                character: foundCharacter
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
            console.log(`$got back`, makeAudioResponse.dialogueAudioFileName)
            project.current.alterDialogueObj[eachDialogue.id].audioFileNameArray.push(makeAudioResponse.dialogueAudioFileName)

            //finish loading
            project.current.alterDialogueObj[eachDialogue.id].loading = false

            //refresh
            refreshProject(["alterDialogueObj"])

            if (singleGeneration) toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <main className={styles.main}>
            <section>
                <ShowMore
                    label='chracters'
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
                                    itemObjs={charactersSearchObj.searchItems.map(eachSeaarchItem => {
                                        return {
                                            item: eachSeaarchItem,
                                            Element: <ViewCharacter seenCharacter={eachSeaarchItem} />
                                        }
                                    })}
                                    selectedIds={charactersInProject.map(eachCharacterInProject => eachCharacterInProject.id)}
                                    selectionAction={async (eachCharacter) => {
                                        try {
                                            //server functions
                                            const inProject = await getSpecificCharacterInProject({ characterId: eachCharacter.id, projectId: seenProject.id }) !== undefined

                                            if (!inProject) {
                                                await addCharacterToProject({ characterId: eachCharacter.id, projectId: seenProject.id })
                                                toast.success("selected user")

                                            } else {
                                                await deleteCharacterInProject({ characterId: eachCharacter.id, projectId: seenProject.id })
                                                toast.success("de-selected user")
                                            }

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
                                    <div key={eachScene.id} className="container" style={{ backgroundColor: "var(--bg2)", padding: "var(--spacingR)", overflow: "auto" }}>
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
                                        </div>

                                        <ShowMore
                                            label="alter scene"
                                            content={(
                                                <div className="container">
                                                    <ShowMore
                                                        label="prompt"
                                                        content={
                                                            <TextArea
                                                                name="alterScenePrompt"
                                                                value={seenAlterScenesObj !== undefined ? seenAlterScenesObj.prompt : ""}
                                                                placeHolder="How would you like to alter this scene..."
                                                                onChange={(e) => {
                                                                    if (project.current.alterScenesObj[eachScene.id] === undefined) {
                                                                        project.current.alterScenesObj[eachScene.id] = makeDefaultAlterScenesObj()
                                                                    }

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
                                                                value={seenAlterScenesObj !== undefined ? seenAlterScenesObj.referencedScenes : ""}
                                                                placeHolder="Enter other scene id's. e.g ID1, ID2"
                                                                onChange={(e) => {
                                                                    if (project.current.alterScenesObj[eachScene.id] === undefined) {
                                                                        project.current.alterScenesObj[eachScene.id] = makeDefaultAlterScenesObj()
                                                                    }

                                                                    project.current.alterScenesObj[eachScene.id].referencedScenes = e.target.value

                                                                    //refresh
                                                                    refreshProject(["alterScenesObj"])
                                                                }}
                                                                onBlur={() => checkProjectErrors(project.current)}
                                                                errors={projectFormErrors[`alterScenesObj/${eachScene.id}/referencedScenes`]}
                                                            />
                                                        }
                                                    />

                                                    {seenAlterScenesObj !== undefined && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    handleAlterScene(seenAlterScenesObj.prompt, eachScene, seenAlterScenesObj.referencedScenes)
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
                                                    <DisplayDialogue key={eachDialogue.id} dialogue={eachDialogue} usedCharacters={charactersInProject} />
                                                )
                                            })}
                                        </div>
                                    </div>
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

                        <button className="button1" style={{ justifySelf: "center" }}
                            onClick={async () => {
                                toast.success("generating all!")

                                await Promise.all(project.current.scenes.map(async eachScene => {
                                    return eachScene.dialogue.map(async eachDialogue => {
                                        await handleDialogueAudio(eachDialogue, false)
                                    })
                                }))

                                toast.success("finished!")
                            }}
                        >generate audio</button>

                        <div className="container gridColumns snap" style={{ gridAutoColumns: "min(500px, 90%)", marginTop: "var(--spacingR)" }}>
                            {project.current.scenes.map((eachScene) => {

                                return (
                                    <div key={eachScene.id} className="container">
                                        {eachScene.dialogue.map(eachDialogue => {
                                            //ensure audio id mapped to dialogue
                                            const seenAlterDialogueObj: alterDialogueObjType["key"] | undefined = project.current.alterDialogueObj[eachDialogue.id]

                                            return (
                                                <div key={eachDialogue.id} className="container">
                                                    <DisplayDialogue dialogue={eachDialogue} usedCharacters={charactersInProject} />

                                                    <button className="button2"
                                                        onClick={async () => {
                                                            await handleDialogueAudio(eachDialogue)
                                                        }}
                                                    >regenerate</button>

                                                    {seenAlterDialogueObj !== undefined && (
                                                        <>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacingS)" }}>
                                                                <audio controls>
                                                                    <source src={`/api/audio/view?projectId=${seenProject.id}&fileName=${seenAlterDialogueObj.audioFileNameArray[seenAlterDialogueObj.variationIndex]}`} type="audio/mpeg" />
                                                                </audio>

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
        </main>
    )
}

function DisplayDialogue({ dialogue, usedCharacters }: { dialogue: dialogueType, usedCharacters: characterType[] }) {
    const foundCharacter = usedCharacters.find(eachCharacter => eachCharacter.id === dialogue.characterId)

    return (
        <div>
            {foundCharacter !== undefined && (
                <b>{foundCharacter.name} </b>
            )}

            <span>{dialogue.sentence}</span>

            {dialogue.emotions && (
                <b> ({dialogue.emotions})</b>
            )}
        </div>

    )
}