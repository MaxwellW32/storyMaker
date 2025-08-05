"use client"
import ShowMore from "@/components/showMore/ShowMore"
import { baseInstructionsPromptFilepath } from "@/lib/dirPaths"
import { alterScene, makeStory } from "@/serverFunctions/handleGpt"
import { refreshProjectPath, updateProject } from "@/serverFunctions/handleProjects"
import { alterScenesObjType, characterType, projectType, sceneType, searchObjType, updateProjectSchema } from "@/types"
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

//how does gpt api work...
//how does eleven labs api work - multi/single tts
//how does after effects integration work - layers, importing, images, audio

export default function ViewProject({ seenProject }: { seenProject: projectType }) {
    const project = useRef<projectType>({ ...seenProject })
    const charactersInProject = project.current.charactersToProjects !== undefined ? project.current.charactersToProjects.map(eachCharacterToProject => eachCharacterToProject.character).filter(each => each !== undefined) : []

    const baseInstructions = useRef<string | undefined>(undefined)
    const projectSaveDebounce = useRef<NodeJS.Timeout | undefined>(undefined)
    const storyLoading = useRef(false)

    const [refresher, refresherSet] = useState(false)

    const [charactersSearchObj, charactersSearchObjSet] = useState<searchObjType<characterType>>({
        searchItems: [],
    })
    // const chosenCharacters = useRef<characterType[]>([])

    // const loading = useRef(false)

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
                refresh()

            } catch (error) {
                consoleAndToastError(error);
            }
        };

        loadInstructions();
    }, []);

    //respond to project changes
    useEffect(() => {
        handleProjectSave()

    }, [refresher])

    //load up chosenCharacters
    useEffect(() => {
        const search = async () => {
            try {
                const seenText = await fetchMainFolderFile(baseInstructionsPromptFilepath, "text");
                baseInstructions.current = seenText;
                refresh()

            } catch (error) {
                consoleAndToastError(error);
            }
        };

        search();
    }, []);

    async function handleProjectSave() {
        try {
            if (projectSaveDebounce.current) clearTimeout(projectSaveDebounce.current)

            projectSaveDebounce.current = setTimeout(() => {
                const validatedProject = updateProjectSchema.parse(project.current)

                console.log(`$saved project.current`, project.current);

                //send to server
                updateProject(seenProject.id, validatedProject)
            }, 10_000);

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function refresh() {
        refresherSet(prev => !prev)
    }

    async function handleGenerateStory() {
        try {
            if (baseInstructions.current === undefined) return

            //loading
            storyLoading.current = true
            project.current.scenes = []

            toast.success("Generating story...")

            const finalPrompt = condenseIntoPrompt({ prompt: project.current.prompt, characters: charactersInProject })
            console.log(`$finalPrompt`, finalPrompt);
            const storyResponse = await makeStory(finalPrompt, baseInstructions.current)
            project.current.scenes = storyResponse.scenes

        } catch (error) {
            consoleAndToastError(error)
        }

        storyLoading.current = false
        refresh()
    }

    async function handleAlterScene(scenePrompt: string, sceneToReplace: sceneType, referencedSceneIds: string) {
        try {
            if (baseInstructions.current === undefined) return
            if (project.current.alterScenesObj[sceneToReplace.id] === undefined) return

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

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function setDefaultAlterScenesObj(): alterScenesObjType["key"] {
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
                        <textarea
                            value={baseInstructions.current}
                            onChange={(e) => {
                                baseInstructions.current = e.target.value
                                refresh()
                            }}
                            placeholder="Describe how the gpt works..."
                            rows={5}
                        />
                    }
                />

                <ShowMore
                    label='Story idea'
                    content={
                        <textarea
                            value={project.current.prompt}
                            onChange={(e) => {
                                project.current.prompt = e.target.value
                                refresh()
                            }}
                            placeholder="Describe your story idea..."
                            rows={5}
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
                                                            <textarea
                                                                value={seenAlterScenesObj !== undefined ? seenAlterScenesObj.prompt : ""}
                                                                onChange={(e) => {
                                                                    if (project.current.alterScenesObj[eachScene.id] === undefined) {
                                                                        project.current.alterScenesObj[eachScene.id] = setDefaultAlterScenesObj()
                                                                    }

                                                                    project.current.alterScenesObj[eachScene.id].prompt = e.target.value

                                                                    refresh()
                                                                }}
                                                                placeholder="How would you like to alter this scene..."
                                                                rows={5}
                                                            />
                                                        }
                                                    />

                                                    <ShowMore
                                                        label="referenced scene id's"
                                                        content={
                                                            <input type="text" value={seenAlterScenesObj !== undefined ? seenAlterScenesObj.referencedScenes : ""}
                                                                onChange={(e) => {
                                                                    if (project.current.alterScenesObj[eachScene.id] === undefined) {
                                                                        project.current.alterScenesObj[eachScene.id] = setDefaultAlterScenesObj()
                                                                    }

                                                                    project.current.alterScenesObj[eachScene.id].referencedScenes = e.target.value

                                                                    refresh()
                                                                }}
                                                                placeholder="Enter other scene id's. e.g ID1, ID2"
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
                                            {eachScene.diologue.map((eachDiologue, eachDiologueIndex) => {
                                                const foundCharacter = charactersInProject.find(eachCharacter => eachCharacter.id === eachDiologue.characterId)

                                                return (
                                                    <div key={eachDiologueIndex}>
                                                        {foundCharacter !== undefined && (
                                                            <span>{foundCharacter.name}</span>
                                                        )}

                                                        <span>{eachDiologue.sentence}</span>

                                                        {eachDiologue.emotions && (
                                                            <span>({eachDiologue.emotions})</span>
                                                        )}
                                                    </div>
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
        </main>
    )
}