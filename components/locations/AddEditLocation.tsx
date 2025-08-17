"use client"
import React, { useEffect, useRef, useState } from 'react'
import styles from "./style.module.css"
import { newLocationSchema, newLocationType, locationSchema, locationType, updateLocationSchema, dbFileType, uploadFileApiResponseSchema, gptImagePromptInstructions, gptPromptInstructionsType, viewType } from '@/types'
import toast from 'react-hot-toast'
import { addLocation, deleteImageForView, updateLocation } from '@/serverFunctions/handleLocations'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { addVariablesToString, convertBtyes, deepClone } from '@/utility/utility'
import ShowMore from '../showMore/ShowMore'
import TextArea from '../inputs/textArea/TextArea'
import { handleWithFiles } from '@/utility/handleWithFiles'
import Image from 'next/image'
import { allowedImageFileTypes, imageFileInputAccept, maxBodyToServerSize, maxFileUploadSize } from '@/lib/uploadFilesLib'
import { v4 as uuidV4 } from 'uuid'
import ConfirmationBox from '../confirmationBox/ConfirmationBox'
import { makeTempImage, makeViewStarters } from '@/serverFunctions/handleGpt'

export default function AddEditLocation({ sentLocation, submissionAction }: { sentLocation?: locationType, submissionAction?: () => void }) {
    const initialFormObj: newLocationType = {
        name: "",
        userId: "dummyData",
        description: "",
        views: [],
    }
    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<locationType>>(deepClone(sentLocation === undefined ? initialFormObj : updateLocationSchema.parse(sentLocation)))


    const respondToChangeAbove = useRef(false)
    const [formErrors, formErrorsSet] = useState<{ [key: string]: string | undefined }>({})

    const [viewImageInstructionsObj, viewImageInstructionsObjSet] = useState<gptImagePromptInstructions>({})
    const [viewStarterInstructionsObj, viewStarterInstructionsObjSet] = useState<gptPromptInstructionsType>({
        baseInstructions: `Generate a new view for the location based on the user’s prompt. Note the locationVariationName are groupings of related location variations. (e.g all views are under summer home location, different views are under winter home location.)

Use the reference location below to stay consistent and to see what's been made already. Each view must be highly precise.

Provide:
A short, fitting view name (its a pov of the current location. e.g front of entrance, middle of forest, bedroom...etc).
A detailed but compact view description (physical, accessories, distinguishing features). The description will be used for image generation, so accuracy and clarity are more important than length.

location:
[[location]]
    `,
        prompt: ``,
        loading: false
    })
    const [imageFormData, imageFormDataSet] = useState<FormData | null>(null)

    //handle changes from above
    useEffect(() => {
        //only respond when allowed
        if (sentLocation === undefined || !respondToChangeAbove.current) return
        respondToChangeAbove.current = false

        formObjSet(deepClone(updateLocationSchema.parse(sentLocation)))

    }, [sentLocation])

    function checkErrors(seenFormObj: Partial<locationType>) {
        formErrorsSet({})

        const testSchema = locationSchema.partial().safeParse(seenFormObj);

        if (testSchema.success) {
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

                //allow refresh
                respondToChangeAbove.current = true

                toast.success("location updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    async function handleGenerateViewStarter() {
        try {
            if (viewStarterInstructionsObj.baseInstructions === "") throw new Error("not seeing baseInstructions")
            if (viewStarterInstructionsObj.prompt === "") throw new Error("not seeing prompt")

            const seenBaseInstructions = addVariablesToString(viewStarterInstructionsObj.baseInstructions, {
                location: formObj
            })
            console.log(`$seenBaseInstructions`, seenBaseInstructions);
            console.log(`$viewStarterInstructionsObj.prompt `, viewStarterInstructionsObj.prompt);

            //loading
            viewStarterInstructionsObjSet(prevViewStarterInstructionsObj => {
                const newViewStarterInstructionsObj = { ...prevViewStarterInstructionsObj }
                newViewStarterInstructionsObj.loading = true
                return newViewStarterInstructionsObj
            })

            toast.success("making appearance(s)...")

            const makeViewStartersResponse = await makeViewStarters(viewStarterInstructionsObj.prompt, seenBaseInstructions)

            const newViews: viewType[] = makeViewStartersResponse.viewStarters.map(eachViewStarter => {
                const newView: viewType = {
                    ...eachViewStarter,
                    id: uuidV4(),
                    file: {
                        src: "",
                        createdAt: new Date(),
                        fileName: "dummyData",
                        status: "to-upload",
                        uploadedAlready: false,
                        fileCategory: "image"
                    },
                }

                return newView
            })

            //set new appearances
            formObjSet(prevFormObj => {
                const newFormObj = { ...prevFormObj }
                if (newFormObj.views === undefined) return prevFormObj

                newFormObj.views = [...newFormObj.views, ...newViews]

                return newFormObj
            })

        } catch (error) {
            consoleAndToastError(error)

        } finally {
            viewStarterInstructionsObjSet(prevViewStarterInstructionsObj => {
                const newViewStarterInstructionsObj = { ...prevViewStarterInstructionsObj }
                newViewStarterInstructionsObj.loading = false
                return newViewStarterInstructionsObj
            })
        }
    }
    async function handleGenerateViewImage(view: viewType) {
        try {
            //ensure location name and description
            if (formObj.name === undefined || formObj.name === "" || formObj.description === undefined || formObj.description === "") throw new Error("need location name and description")

            const seenViewImageInstructionsObj = viewImageInstructionsObj[view.id]
            if (seenViewImageInstructionsObj === undefined) throw new Error("not seeing seenViewImageInstructionsObj")

            toast.success(`${seenViewImageInstructionsObj.mode === "edit" ? "editing" : "generating"} view image!`)

            //set loading
            viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                if (prevViewImageInstructionsObj[view.id] === undefined) return prevViewImageInstructionsObj

                //react refresh
                const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
                newViewImageInstructionsObj[view.id] = { ...newViewImageInstructionsObj[view.id] }

                newViewImageInstructionsObj[view.id].loading = true

                return newViewImageInstructionsObj
            })

            const finalPrompt = addVariablesToString(seenViewImageInstructionsObj.prompt, {
                view: view,
                location: formObj
            })
            const makeLocationViewImageResponse = await makeTempImage(finalPrompt, seenViewImageInstructionsObj.formData)

            //update src
            viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                if (prevViewImageInstructionsObj[view.id] === undefined) return prevViewImageInstructionsObj

                //react refresh
                const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
                newViewImageInstructionsObj[view.id] = { ...newViewImageInstructionsObj[view.id] }

                newViewImageInstructionsObj[view.id].imageSrc = makeLocationViewImageResponse.src

                return newViewImageInstructionsObj
            })

            toast.success("finished!")

        } catch (error) {
            consoleAndToastError(error)
        }

        //finish loading
        viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
            if (prevViewImageInstructionsObj[view.id] === undefined) return prevViewImageInstructionsObj

            //react refresh
            const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
            newViewImageInstructionsObj[view.id] = { ...newViewImageInstructionsObj[view.id] }

            newViewImageInstructionsObj[view.id].loading = false

            return newViewImageInstructionsObj
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
                        onBlur={() => { checkErrors(formObj) }}
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
                        onBlur={() => { checkErrors(formObj) }}
                        errors={formErrors["description"]}
                    />
                </>
            )}

            {formObj.views !== undefined && (
                <>
                    <label>views*</label>

                    <div className='gridColumns snap'>
                        {formObj.views.map((eachView, eachViewIndex) => {
                            if (eachView.file.status === "to-delete") return null

                            const seenViewImageInstructionsObj = viewImageInstructionsObj[eachView.id]
                            if (seenViewImageInstructionsObj === undefined) {
                                viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                                    const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }

                                    newViewImageInstructionsObj[eachView.id] = {
                                        loading: false,
                                        prompt: `Generate a single, high-resolution illustration showing one specific viewpoint of the given location.

Depict only this viewpoint given the view object (e.g., view name: “front door,” “living room,” “start of forest,” “deep in forest,” “end of forest”), with no other angles.
Maintain the same visual style, color palette, and environmental details across all viewpoints of this location to ensure consistency in later scenes.
Include only elements that belong to the described location and angle — no extra objects or characters unless explicitly stated.
Keep lighting, perspective, and rendering style uniform with previous images of this location so they look like they belong to the same illustrated world.
The goal is to create a reference image for this specific view of the location that can be reused for storybook scene consistency.

Generate a single, high-resolution illustration showing one specific viewpoint of the given location.

view:
[[view]]

location: 
[[location]]`,
                                        imageSrc: "",
                                        mode: "make",
                                    }

                                    return newViewImageInstructionsObj
                                })
                            }

                            let containsFileErrors = false
                            Object.entries(formErrors).forEach(eachEntry => {
                                if (eachEntry[0].includes(`views/${eachViewIndex}/file`)) containsFileErrors = true
                            })

                            return (
                                <div key={eachView.id} className='container' style={{ position: "relative", maxHeight: "80vh", overflow: "auto" }}>
                                    <ConfirmationBox text='' confirmationText='Are you sure you want to delete this view?' successMessage='view deleted!' iconName={"delete"} float={true}
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
                                        onBlur={() => checkErrors(formObj)}
                                        errors={formErrors[`views/${eachViewIndex}/name`]}
                                    />

                                    {eachView.file.uploadedAlready && sentLocation !== undefined ? (
                                        <Image alt={`${eachView.file.fileName} image`} width={1000} height={1000} src={`/api/locations/images/download?locationId=${sentLocation.id}&src=${eachView.file.src}`} style={{ objectFit: "contain", width: "100%" }} />
                                    ) : (
                                        <p>{eachView.file.fileName}</p>
                                    )}

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
                                        onBlur={() => checkErrors(formObj)}
                                        errors={formErrors[`views/${eachViewIndex}/locationVariationName`]}
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
                                        onBlur={() => checkErrors(formObj)}
                                        errors={formErrors[`views/${eachViewIndex}/description`]}
                                    />

                                    <ShowMore
                                        label='generate image'
                                        content={(
                                            <>
                                                {seenViewImageInstructionsObj !== undefined && (
                                                    <div className='container'>
                                                        <ShowMore
                                                            label='prompt'
                                                            content={(
                                                                <div className='container'>
                                                                    <div className='flexContainer'>
                                                                        <button className='button2'
                                                                            onClick={() => {
                                                                                viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                                                                                    if (prevViewImageInstructionsObj[eachView.id] === undefined) return prevViewImageInstructionsObj

                                                                                    //react refresh
                                                                                    const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
                                                                                    newViewImageInstructionsObj[eachView.id] = { ...newViewImageInstructionsObj[eachView.id] }

                                                                                    //toggle
                                                                                    newViewImageInstructionsObj[eachView.id].mode = newViewImageInstructionsObj[eachView.id].mode === "make" ? "edit" : "make"

                                                                                    return newViewImageInstructionsObj
                                                                                })
                                                                            }}
                                                                        >Mode: {seenViewImageInstructionsObj.mode}</button>

                                                                        {seenViewImageInstructionsObj.mode === "edit" && (
                                                                            <>
                                                                                <button className='button2' style={{ justifySelf: "flex-start", backgroundColor: seenViewImageInstructionsObj.formData === undefined ? "" : "var(--c3)" }}>
                                                                                    <label htmlFor={`viewEditImageUpload${eachView.id}`} style={{ cursor: "pointer" }}>
                                                                                        upload
                                                                                    </label>
                                                                                </button>

                                                                                <input id={`viewEditImageUpload${eachView.id}`} type="file" multiple={true} placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
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
                                                                                                viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                                                                                                    if (prevViewImageInstructionsObj[eachView.id] === undefined) return prevViewImageInstructionsObj

                                                                                                    //react refresh
                                                                                                    const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
                                                                                                    newViewImageInstructionsObj[eachView.id] = { ...newViewImageInstructionsObj[eachView.id] }

                                                                                                    const seenFormData = new FormData();
                                                                                                    seenFormData.append(fileSrc, file)
                                                                                                    newViewImageInstructionsObj[eachView.id].formData = seenFormData

                                                                                                    return newViewImageInstructionsObj
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
                                                                        name={`${eachView.id}generateImagePrompt`}
                                                                        value={seenViewImageInstructionsObj.prompt}
                                                                        placeHolder="Enter the prompt for this image generation..."
                                                                        onChange={(e) => {
                                                                            viewImageInstructionsObjSet(prevViewImageInstructionsObj => {
                                                                                if (prevViewImageInstructionsObj[eachView.id] === undefined) return prevViewImageInstructionsObj

                                                                                //react refresh
                                                                                const newViewImageInstructionsObj = { ...prevViewImageInstructionsObj }
                                                                                newViewImageInstructionsObj[eachView.id] = { ...newViewImageInstructionsObj[eachView.id] }

                                                                                newViewImageInstructionsObj[eachView.id].prompt = e.target.value

                                                                                return newViewImageInstructionsObj
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        />

                                                        {seenViewImageInstructionsObj.imageSrc !== "" && (
                                                            <>
                                                                <label>Image preview</label>

                                                                <Image alt={`${eachView.id} image preview`} width={500} height={500} src={`/api/previewImages/download?src=${seenViewImageInstructionsObj.imageSrc}`} style={{ objectFit: "contain", width: "100%" }} />
                                                            </>
                                                        )}

                                                        <button className='button1'
                                                            onClick={() => handleGenerateViewImage(eachView)}
                                                        >
                                                            {seenViewImageInstructionsObj.mode === "edit" ? seenViewImageInstructionsObj.loading ? "editing..." : "edit" : seenViewImageInstructionsObj.loading ? "generating..." : "generate"}
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
                                                const fileSrc = `${eachView.id}___${uuidV4()}.${fileEnding}` //enusres refresh on swaps

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
                                                    name="viewStarterInstructionsObjBaseInstructions"
                                                    value={viewStarterInstructionsObj.baseInstructions}
                                                    placeHolder="Describe how the gpt works..."
                                                    onChange={(e) => {
                                                        viewStarterInstructionsObjSet(prevViewStarterInstructionsObj => {
                                                            const newViewStarterInstructionsObj = { ...prevViewStarterInstructionsObj }

                                                            newViewStarterInstructionsObj.baseInstructions = e.target.value

                                                            return newViewStarterInstructionsObj
                                                        })
                                                    }}
                                                />

                                            )}
                                        />

                                        <label>prompt</label>
                                        <TextArea
                                            name="viewStarterInstructionsObjPrompt"
                                            value={viewStarterInstructionsObj.prompt}
                                            placeHolder="Enter your prompt for the new appearance..."
                                            onChange={(e) => {
                                                viewStarterInstructionsObjSet(prevViewStarterInstructionsObj => {
                                                    const newViewStarterInstructionsObj = { ...prevViewStarterInstructionsObj }

                                                    newViewStarterInstructionsObj.prompt = e.target.value

                                                    return newViewStarterInstructionsObj
                                                })
                                            }}
                                        />

                                        <button className='button1'
                                            onClick={handleGenerateViewStarter}
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
                                    </>
                                )}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* <div className='container'>
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
            </div> */}
            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentLocation !== undefined ? "update" : "submit"}</button>
        </form>
    )
}