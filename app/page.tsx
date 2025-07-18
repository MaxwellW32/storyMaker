"use client"

import ShowMore from "@/components/showMore/ShowMore"
import { baseInstructionsVar } from "@/lib/gptPrompts"
import { alterScene, makeStory } from "@/serverFunctions/handleGpt"
import { alterScenesObjSchema, alterScenesObjType, sceneSchema, scenesExample, sceneType } from "@/types"
import { consoleAndToastError } from "@/useful/consoleErrorWithToast"
import { retreiveFromLocalStorage, saveToLocalStorage } from "@/utility"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

//how does gpt api work...
//how does eleven labs api work - multi/single tts
//how does after effects integration work - layers, importing, images, audio

type savedSceneInfoType = {
    scenes: sceneType[],
    alterScenesObj: alterScenesObjType
}

export default function Page() {
    const [baseIntructions, baseIntructionsSet] = useState(baseInstructionsVar)
    const [prompt, promptSet] = useState("Write a story about a dragon and a lost kitten.")

    const [scenes, scenesSet] = useState<sceneType[]>([...scenesExample])
    const [alterScenesObj, alterScenesObjSet] = useState<alterScenesObjType>({})

    const [loading, setLoading] = useState(false)
    const [checkedForSave, checkedForSaveSet] = useState(false)

    //read save from storage
    useEffect(() => {
        checkedForSaveSet(true)

        const seenSavedSceneInfo: savedSceneInfoType | null = retreiveFromLocalStorage("savedSceneInfo")
        if (seenSavedSceneInfo === null) return

        try {
            sceneSchema.array().parse(seenSavedSceneInfo.scenes)
            scenesSet(seenSavedSceneInfo.scenes)

            alterScenesObjSchema.parse(seenSavedSceneInfo.alterScenesObj)
            alterScenesObjSet(seenSavedSceneInfo.alterScenesObj)

        } catch (error) {
            consoleAndToastError(error)
        }
    }, [])

    //save form to storage
    useEffect(() => {
        if (!checkedForSave) return

        const newSavedSceneInfo: savedSceneInfoType = {
            scenes: scenes,
            alterScenesObj: alterScenesObj
        }

        saveToLocalStorage("savedSceneInfo", newSavedSceneInfo)

    }, [scenes, alterScenesObj])

    async function handleGenerateStory() {
        try {
            //loading
            setLoading(true)
            scenesSet([])

            toast.success("Generating story...")

            const response = await makeStory(prompt, baseIntructions)
            scenesSet(response.scenes)

        } catch (error) {
            consoleAndToastError(error)
        }

        setLoading(false)
    }

    async function handleAlterScene(scenePrompt: string, sceneToReplace: sceneType, referencedSceneIds: string) {
        try {
            //loading
            alterScenesObjSet(prevAlterScenesObj => {
                const newAlterScenesObj = { ...prevAlterScenesObj }
                if (newAlterScenesObj[sceneToReplace.id] === undefined) return prevAlterScenesObj

                newAlterScenesObj[sceneToReplace.id].loading = true

                return newAlterScenesObj
            })

            //get scenes referenced for context
            const referencedScenesIdArr: sceneType["id"][] = referencedSceneIds !== "" ? referencedSceneIds.split(",") : []

            const referenceScenes = referencedScenesIdArr.map(eachReferenceId => {
                const foundScene = scenes.find(eachScene => eachScene.id === eachReferenceId.trim())
                if (foundScene === undefined) throw new Error("not seeing scene with id specified")
                return foundScene
            })

            const newAlteredSceneResponse = await alterScene(scenePrompt, baseIntructions, sceneToReplace, referenceScenes)

            const newReplacedScene = { ...newAlteredSceneResponse.scene, id: sceneToReplace.id }

            //save scenes to variations - old and new
            alterScenesObjSet(prevAlterScenesObj => {
                const newAlterScenesObj = { ...prevAlterScenesObj }
                if (newAlterScenesObj[sceneToReplace.id] === undefined) return prevAlterScenesObj

                //add onto array
                newAlterScenesObj[sceneToReplace.id].variations = [...newAlterScenesObj[sceneToReplace.id].variations, sceneToReplace, newReplacedScene]

                return newAlterScenesObj
            })

            //replace the scene
            scenesSet(prevScenesSet => {
                const newScenesSet = [...prevScenesSet].map(eachScene => {
                    if (eachScene.id === sceneToReplace.id) {
                        //keep og id
                        eachScene = newReplacedScene
                    }

                    return eachScene
                })

                return newScenesSet
            })

            //finished loading
            alterScenesObjSet(prevAlterScenesObj => {
                const newAlterScenesObj = { ...prevAlterScenesObj }
                if (newAlterScenesObj[sceneToReplace.id] === undefined) return prevAlterScenesObj

                newAlterScenesObj[sceneToReplace.id].loading = false

                return newAlterScenesObj
            })

        } catch (error) {
            consoleAndToastError(error)
        }

        setLoading(false)
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
        if (alterScenesObj[sceneId] === undefined) throw new Error("not seeing alter scenes obj for scene id")
        const seenVariations = alterScenesObj[sceneId].variations

        //get index
        let seenIndex = alterScenesObj[sceneId].variationIndex

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

        //update index in variations obj
        alterScenesObjSet(prevAlterScenesObj => {
            const newAlterScenesObj = { ...prevAlterScenesObj }
            if (newAlterScenesObj[sceneId] === undefined) return prevAlterScenesObj

            newAlterScenesObj[sceneId].variationIndex = seenIndex

            return newAlterScenesObj
        })

        //update scene array
        scenesSet(prevScenesSet => {
            const newScenesSet = [...prevScenesSet].map(eachScene => {
                if (eachScene.id === sceneId) {
                    eachScene = { ...newScene }
                }

                return eachScene
            })

            return newScenesSet
        })
    }

    return (
        <main className="container">
            <section>
                <h2>Story Prompt</h2>

                <ShowMore
                    label='general behaviour'
                    content={
                        <textarea
                            value={baseIntructions}
                            onChange={(e) => baseIntructionsSet(e.target.value)}
                            placeholder="Describe how the gpt works..."
                            rows={5}
                        />
                    }
                />

                <ShowMore
                    label='Story idea'
                    content={
                        <textarea
                            value={prompt}
                            onChange={(e) => promptSet(e.target.value)}
                            placeholder="Describe your story idea..."
                            rows={5}
                        />
                    }
                    startShowing={true}
                />

                <button
                    onClick={handleGenerateStory}
                    disabled={loading}
                    className="button1"
                >
                    {loading ? "Generating..." : "Generate Story"}
                </button>
            </section>

            <section>
                {loading && (<p>loading...</p>)}

                {scenes.length > 0 ? (
                    <>
                        {scenes.map((eachScene, eachSceneIndex) => {
                            const seenAlterScenesObj: alterScenesObjType["key"] | undefined = alterScenesObj[eachScene.id]

                            return <div key={eachScene.id} className="container" style={{ backgroundColor: "var(--bg2)" }}>
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
                                                            alterScenesObjSet(prevAlterScenesObj => {
                                                                const newAlterScenesObj = { ...prevAlterScenesObj }
                                                                if (newAlterScenesObj[eachScene.id] === undefined) {
                                                                    newAlterScenesObj[eachScene.id] = setDefaultAlterScenesObj()
                                                                }

                                                                newAlterScenesObj[eachScene.id].prompt = e.target.value

                                                                return newAlterScenesObj
                                                            })
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
                                                            alterScenesObjSet(prevAlterScenesObj => {
                                                                const newAlterScenesObj = { ...prevAlterScenesObj }
                                                                if (newAlterScenesObj[eachScene.id] === undefined) {
                                                                    newAlterScenesObj[eachScene.id] = setDefaultAlterScenesObj()
                                                                }

                                                                newAlterScenesObj[eachScene.id].referencedScenes = e.target.value

                                                                return newAlterScenesObj
                                                            })
                                                        }}
                                                        placeholder="Enter other scene id's that set the context for this scene, comma separated"
                                                    />
                                                }
                                            />

                                            {seenAlterScenesObj !== undefined && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            handleAlterScene(seenAlterScenesObj.prompt, eachScene, seenAlterScenesObj.referencedScenes)
                                                        }}
                                                        disabled={loading}
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

                                {eachScene.backgroundImageSrc && (
                                    <Image alt={`Scene ${eachSceneIndex + 1} Background`} src={eachScene.backgroundImageSrc} width={1000} height={1000} style={{ objectFit: "contain", width: "100%", }} />
                                )}

                                <div className="container">
                                    {eachScene.diologue.map((line, lineIndex) => (
                                        <div key={lineIndex}>
                                            <span>{line.characterId}:</span>{" "}

                                            <span>{line.sentence}</span>{" "}

                                            {line.emotions && (
                                                <span>
                                                    ({line.emotions})
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        })}
                    </>
                ) : (
                    <p>Your generated scenes will appear here.</p>
                )}
            </section>
        </main>
    )
}