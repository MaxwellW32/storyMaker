"use client"
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import { newLocationSchema, newLocationType, locationSchema, locationType, updateLocationSchema, dbFileType, uploadFileApiResponseSchema, viewType } from '@/types'
import toast from 'react-hot-toast'
import { addLocation, deleteImageForView, updateLocation } from '@/serverFunctions/handleLocations'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { convertBtyes, deepClone } from '@/utility/utility'
import ShowMore from '../showMore/ShowMore'
import TextArea from '../inputs/textArea/TextArea'
import { handleWithFiles } from '@/utility/handleWithFiles'
import Image from 'next/image'
import { allowedImageFileTypes, imageFileInputAccept, maxBodyToServerSize, maxFileUploadSize } from '@/lib/uploadFilesLib'
import { v4 as uuidV4 } from 'uuid'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { makeTempImage } from '@/serverFunctions/handleGpt'

export default function AddEditLocation({ sentLocation, submissionAction }: { sentLocation?: locationType, submissionAction?: () => void }) {
    const initialFormObj: newLocationType = {
        name: "",
        userId: "dummyData",
        description: "",
        views: [],
    }
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<locationType>>(deepClone(sentLocation === undefined ? initialFormObj : updateLocationSchema.parse(sentLocation)))
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in keyof locationType]: string }>>({})

    const [viewInstructionsObj, viewInstructionsObjSet] = useState<{
        [key: string]: {
            prompt: string,
            loading: boolean,
            imageSrc: string,
        }
    }>({})
    const [imageFormData, imageFormDataSet] = useState<FormData | null>(null)

    const respondToChangeAbove = useRef(false)

    //handle changes from above
    useEffect(() => {
        //only respond when allowed
        if (sentLocation === undefined || !respondToChangeAbove.current) return
        respondToChangeAbove.current = false

        formObjSet(deepClone(updateLocationSchema.parse(sentLocation)))

    }, [sentLocation])

    function checkIfValid(seenFormObj: Partial<locationType>, seenName: keyof locationType) {
        // @ts-expect-error type
        const testSchema = locationSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

        if (testSchema.success) {//worked
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }
                delete newObj[seenName]

                return newObj
            })

        } else {
            formErrorsSet(prevObj => {
                const newObj = { ...prevObj }

                let errorMessage = ""

                JSON.parse(testSchema.error.message).forEach((eachErrorObj: Error) => {
                    errorMessage += ` ${eachErrorObj.message}`
                })

                newObj[seenName] = errorMessage

                return newObj
            })
        }
    }

    async function handleSubmit() {
        try {
            toast.success("submittting")

            //new location
            if (sentLocation === undefined) {
                const validatedNewLocation = newLocationSchema.parse(formObj)

                //send up to server
                const addedLocation = await addLocation(validatedNewLocation)

                //views
                if (addedLocation.views !== undefined) {
                    addedLocation.views = await handleWithFiles(addedLocation.views, imageFormData, {
                        upload: async () => {
                            if (imageFormData === null) throw new Error("imageFormData null")

                            //set formData info
                            imageFormData.append("locationId", addedLocation.id)

                            const response = await fetch(`/api/locations/images/upload`, {
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
                            if (sentLocation !== undefined) {
                                await deleteImageForView(addedLocation.id, dbWithFilesObjs)
                            }
                        }
                    })

                    //update same location
                    await updateLocation(addedLocation.id, { views: addedLocation.views })
                }

                //reset
                imageFormDataSet(null)
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedLocation = updateLocationSchema.parse(formObj)

                //views
                if (validatedUpdatedLocation.views !== undefined) {
                    validatedUpdatedLocation.views = await handleWithFiles(validatedUpdatedLocation.views, imageFormData, {
                        upload: async () => {
                            if (imageFormData === null) throw new Error("imageFormData null")

                            //set formData info
                            imageFormData.append("locationId", sentLocation.id)

                            const response = await fetch(`/api/locations/images/upload`, {
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
                            if (sentLocation !== undefined) {
                                await deleteImageForView(sentLocation.id, dbWithFilesObjs)
                            }
                        }
                    })
                }

                //update
                await updateLocation(sentLocation.id, validatedUpdatedLocation)

                //reset
                imageFormDataSet(null)

                toast.success("location updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    async function handleGenerateViewImage(view: viewType) {
        try {
            //ensure location description
            if (formObj.name === undefined || formObj.name === "" || formObj.description === undefined || formObj.description === "") throw new Error("need location name and description")

            const seenViewInstructionsObj = viewInstructionsObj[view.id]
            if (seenViewInstructionsObj === undefined) throw new Error("not seeing seenViewInstructionsObj")

            toast.success("generating view image!")

            //set loading
            viewInstructionsObjSet(prevViewInstructionsObj => {
                if (prevViewInstructionsObj[view.id] === undefined) return prevViewInstructionsObj

                //react refresh
                const newViewInstructionsObj = { ...prevViewInstructionsObj }
                newViewInstructionsObj[view.id] = { ...newViewInstructionsObj[view.id] }

                newViewInstructionsObj[view.id].loading = true

                return newViewInstructionsObj
            })

            const finalPrompt = `${seenViewInstructionsObj.prompt}\nview name:\n${view.name}\nlocation name:\n${formObj.name}\n\nlocation description:\n${formObj.description}`
            const makeLocationViewImageResponse = await makeTempImage(finalPrompt)

            //update src
            viewInstructionsObjSet(prevViewInstructionsObj => {
                if (prevViewInstructionsObj[view.id] === undefined) return prevViewInstructionsObj

                //react refresh
                const newViewInstructionsObj = { ...prevViewInstructionsObj }
                newViewInstructionsObj[view.id] = { ...newViewInstructionsObj[view.id] }

                newViewInstructionsObj[view.id].imageSrc = makeLocationViewImageResponse.src

                return newViewInstructionsObj
            })

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }

        //finish loading
        viewInstructionsObjSet(prevViewInstructionsObj => {
            if (prevViewInstructionsObj[view.id] === undefined) return prevViewInstructionsObj

            //react refresh
            const newViewInstructionsObj = { ...prevViewInstructionsObj }
            newViewInstructionsObj[view.id] = { ...newViewInstructionsObj[view.id] }

            newViewInstructionsObj[view.id].loading = false

            return newViewInstructionsObj
        })
    }

    return (
        <form className={styles.form} action={() => { }}>
            {formObj.name !== undefined && (
                <>
                    <TextInput
                        name={"name"}
                        value={formObj.name}
                        type={"text"}
                        label={"location name"}
                        placeHolder={"enter location name"}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.name === undefined) return prevFormObj

                                newFormObj.name = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "name") }}
                        errors={formErrors["name"]}
                    />
                </>
            )}

            {formObj.description !== undefined && (
                <>
                    <TextInput
                        name={"description"}
                        value={formObj.description}
                        type={"text"}
                        label={"location description"}
                        placeHolder={"enter location description"}
                        required=''
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.description === undefined) return prevFormObj

                                newFormObj.description = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "description") }}
                        errors={formErrors["description"]}
                    />
                </>
            )}

            {formObj.views !== undefined && (
                <>
                    <label>views*</label>

                    <div className='gridColumns snap'>
                        {formObj.views.map(eachView => {
                            if (eachView.file.status === "to-delete") return null

                            const seenViewInstructionsObj = viewInstructionsObj[eachView.id]
                            if (seenViewInstructionsObj === undefined) {
                                viewInstructionsObjSet(prevViewInstructionsObj => {
                                    const newViewInstructionsObj = { ...prevViewInstructionsObj }

                                    newViewInstructionsObj[eachView.id] = {
                                        loading: false,
                                        prompt: `Generate a single, high-resolution illustration showing one specific viewpoint of the given location.

Depict only this viewpoint given the name (e.g., “front door,” “living room,” “start of forest,” “deep in forest,” “end of forest”), with no other angles.
Maintain the same visual style, color palette, and environmental details across all viewpoints of this location to ensure consistency in later scenes.
Include only elements that belong to the described location and angle — no extra objects or characters unless explicitly stated.
Keep lighting, perspective, and rendering style uniform with previous images of this location so they look like they belong to the same illustrated world.
The goal is to create a reference image for this specific view of the location that can be reused for storybook scene consistency.`,
                                        imageSrc: ""
                                    }

                                    return newViewInstructionsObj
                                })
                            }

                            return (
                                <div key={eachView.id} className='container' style={{ position: "relative" }}>
                                    <ConfirmationBox text='' confirmationText='Are you sure you want to delete this view?' successMessage='view deleted!' iconName={"delete"} float={true}
                                        style={{ justifySelf: "flex-end" }}
                                        runAction={() => {
                                            //change status
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.views === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.views = newFormObj.views.map(eachViewMap => {
                                                    if (eachViewMap.id === eachView.id) {
                                                        eachViewMap = { ...eachViewMap }
                                                        eachViewMap.file = { ...eachViewMap.file }
                                                        eachViewMap.file.status = "to-delete"
                                                    }

                                                    return eachViewMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <label>name</label>
                                    <TextInput
                                        name={`${eachView.id}viewName`}
                                        value={eachView.name}
                                        placeHolder="View name. E.g Front door, Living room..."
                                        onChange={(e) => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.views === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.views = newFormObj.views.map(eachViewMap => {
                                                    if (eachViewMap.id === eachView.id) {
                                                        eachViewMap = { ...eachViewMap }
                                                        eachViewMap.name = e.target.value
                                                    }

                                                    return eachViewMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <label>location variation name</label>
                                    <TextInput
                                        name={`${eachView.id}locationVariationName`}
                                        value={eachView.locationVariationName}
                                        placeHolder="Variation name of location. E.g Summer Home, Winter Home..."
                                        onChange={(e) => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.views === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.views = newFormObj.views.map(eachViewMap => {
                                                    if (eachViewMap.id === eachView.id) {
                                                        eachViewMap = { ...eachViewMap }
                                                        eachViewMap.locationVariationName = e.target.value
                                                    }

                                                    return eachViewMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <label>description</label>
                                    <TextArea
                                        name={`${eachView.id}viewDescription`}
                                        value={eachView.description}
                                        placeHolder="Physical description of this view e.g large forst..."
                                        onChange={(e) => {
                                            formObjSet(prevFormObj => {
                                                const newFormObj = { ...prevFormObj }
                                                if (newFormObj.views === undefined) return prevFormObj

                                                //react refresh
                                                newFormObj.views = newFormObj.views.map(eachViewMap => {
                                                    if (eachViewMap.id === eachView.id) {
                                                        eachViewMap = { ...eachViewMap }
                                                        eachViewMap.description = e.target.value
                                                    }

                                                    return eachViewMap
                                                })

                                                return newFormObj
                                            })
                                        }}
                                    />

                                    <ShowMore
                                        label='generate image'
                                        content={(
                                            <>
                                                {seenViewInstructionsObj !== undefined && (
                                                    <div className='container'>
                                                        <ShowMore
                                                            label='prompt'
                                                            content={(
                                                                <TextArea
                                                                    name={`${eachView.id}generateImagePrompt`}
                                                                    value={seenViewInstructionsObj.prompt}
                                                                    placeHolder="Enter the prompt for this image generation..."
                                                                    onChange={(e) => {
                                                                        viewInstructionsObjSet(prevViewInstructionsObj => {
                                                                            if (prevViewInstructionsObj[eachView.id] === undefined) return prevViewInstructionsObj

                                                                            //react refresh
                                                                            const newViewInstructionsObj = { ...prevViewInstructionsObj }
                                                                            newViewInstructionsObj[eachView.id] = { ...newViewInstructionsObj[eachView.id] }

                                                                            newViewInstructionsObj[eachView.id].prompt = e.target.value

                                                                            return newViewInstructionsObj
                                                                        })
                                                                    }}
                                                                />
                                                            )}
                                                        />

                                                        {seenViewInstructionsObj.imageSrc !== "" && (
                                                            <>
                                                                <label>Image preview</label>

                                                                <Image alt={`${eachView.id} image preview`} width={500} height={500} src={`/api/previewImages/download?src=${seenViewInstructionsObj.imageSrc}`} style={{ objectFit: "contain", width: "100%" }} />
                                                            </>
                                                        )}

                                                        <button className='button1'
                                                            onClick={() => handleGenerateViewImage(eachView)}
                                                        >
                                                            {seenViewInstructionsObj.loading ? "generating..." : "generate"}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    />

                                    <button className='button1' style={{ justifySelf: "flex-start" }}>
                                        <label htmlFor={`viewImageUpload${eachView.id}`} style={{ cursor: "pointer" }}>
                                            upload
                                        </label>
                                    </button>

                                    <input id={`viewImageUpload${eachView.id}`} type="file" placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
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
                                                const fileSrc = `${eachView.id}.${fileEnding}`

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
                                                    if (newFormObj.views === undefined) return prevFormObj

                                                    //react refresh
                                                    newFormObj.views = newFormObj.views.map(eachViewMap => {
                                                        if (eachViewMap.id === eachView.id) {
                                                            eachViewMap = { ...eachViewMap }
                                                            eachViewMap.file = { ...newDbUploadFile }
                                                        }

                                                        return eachViewMap
                                                    })

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

                                    {eachView.file.uploadedAlready && sentLocation !== undefined ? (
                                        <Image alt={`${eachView.file.fileName} image`} width={100} height={100} src={`/api/locations/images/download?locationId=${sentLocation.id}&src=${eachView.file.src}`} style={{ objectFit: "contain" }} />
                                    ) : (
                                        <p>{eachView.file.fileName}</p>
                                    )}
                                </div>
                            )
                        })}

                        <div className='container'>
                            <button className='button1'
                                onClick={() => {
                                    formObjSet(prevFormObj => {
                                        const newFormObj = { ...prevFormObj }
                                        if (newFormObj.views === undefined) return prevFormObj

                                        const newView: viewType = {
                                            id: uuidV4(),
                                            name: "",
                                            description: "",
                                            locationVariationName: "",
                                            file: {
                                                src: "",
                                                createdAt: new Date(),
                                                fileName: "",
                                                status: "to-upload",
                                                uploadedAlready: false,
                                                fileCategory: "image"
                                            },
                                        }

                                        newFormObj.views = [...newFormObj.views, newView]

                                        return newFormObj
                                    })
                                }}
                            >make new</button>
                        </div>
                    </div>
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentLocation !== undefined ? "update" : "submit"}</button>
        </form>
    )
}