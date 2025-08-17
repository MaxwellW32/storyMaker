import { gptImagePromptInstructionsOuterObj, gptImagePromptInstructionsObjType } from '@/types'
import React from 'react'
import ShowMore from '../showMore/ShowMore'
import TextArea from '../inputs/textArea/TextArea'
import Image from 'next/image'
import { allowedImageFileTypes, imageFileInputAccept, maxBodyToServerSize, maxFileUploadSize } from '@/lib/uploadFilesLib'
import { convertBtyes } from '@/utility/utility'
import { v4 as uuidV4 } from 'uuid'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import toast from 'react-hot-toast'

export default function EditImagePromptInstructionsOuterObj({ usedId, imagePromptInstructionsOuterObjStarter, imagePromptInstructionsOuterObj, imagePromptInstructionsOuterObjSet, generateImage }: { usedId: string, imagePromptInstructionsOuterObjStarter: gptImagePromptInstructionsOuterObj["key"], imagePromptInstructionsOuterObj: gptImagePromptInstructionsOuterObj, imagePromptInstructionsOuterObjSet: React.Dispatch<React.SetStateAction<gptImagePromptInstructionsOuterObj>>, generateImage: () => Promise<void> }) {
    const seenImageInstructionsObj = imagePromptInstructionsOuterObj[usedId]
    if (seenImageInstructionsObj === undefined) {
        imagePromptInstructionsOuterObjSet(prevImagePromptInstructionsOuterObj => {
            const newImagePromptInstructionsOuterObj = { ...prevImagePromptInstructionsOuterObj }

            newImagePromptInstructionsOuterObj[usedId] = imagePromptInstructionsOuterObjStarter

            return newImagePromptInstructionsOuterObj
        })

        return null
    }

    return (
        <ShowMore
            label='generate image'
            content={(
                <div className='container'>
                    <ShowMore
                        label='prompt'
                        content={(
                            <div className='container'>
                                <div className='flexContainer'>
                                    <button className='button2'
                                        onClick={() => {
                                            imagePromptInstructionsOuterObjSet(prevImagePromptInstructionsOuterObj => {
                                                if (prevImagePromptInstructionsOuterObj[usedId] === undefined) return prevImagePromptInstructionsOuterObj

                                                //react refresh
                                                const newImagePromptInstructionsOuterObj = { ...prevImagePromptInstructionsOuterObj }
                                                newImagePromptInstructionsOuterObj[usedId] = { ...newImagePromptInstructionsOuterObj[usedId] }

                                                //toggle
                                                newImagePromptInstructionsOuterObj[usedId].mode = newImagePromptInstructionsOuterObj[usedId].mode === "make" ? "edit" : "make"

                                                return newImagePromptInstructionsOuterObj
                                            })
                                        }}
                                    >Mode: {seenImageInstructionsObj.mode}</button>

                                    {seenImageInstructionsObj.mode === "edit" && (
                                        <>
                                            <button className='button2' style={{ justifySelf: "flex-start", backgroundColor: seenImageInstructionsObj.formData === undefined ? "" : "var(--c3)" }}>
                                                <label htmlFor={`editImageUpload${usedId}`} style={{ cursor: "pointer" }}>
                                                    upload
                                                </label>
                                            </button>

                                            <input id={`editImageUpload${usedId}`} type="file" multiple={true} placeholder='Upload images' accept={imageFileInputAccept} style={{ display: "none" }}
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
                                                            imagePromptInstructionsOuterObjSet(prevImagePromptInstructionsOuterObj => {
                                                                if (prevImagePromptInstructionsOuterObj[usedId] === undefined) return prevImagePromptInstructionsOuterObj

                                                                //react refresh
                                                                const newImagePromptInstructionsOuterObj = { ...prevImagePromptInstructionsOuterObj }
                                                                newImagePromptInstructionsOuterObj[usedId] = { ...newImagePromptInstructionsOuterObj[usedId] }

                                                                const seenFormData = new FormData();
                                                                seenFormData.append(fileSrc, file)
                                                                newImagePromptInstructionsOuterObj[usedId].formData = seenFormData

                                                                return newImagePromptInstructionsOuterObj
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
                                    name={`${usedId}generateImagePrompt`}
                                    value={seenImageInstructionsObj.prompt}
                                    placeHolder="Enter the prompt for this image generation..."
                                    onChange={(e) => {
                                        imagePromptInstructionsOuterObjSet(prevImagePromptInstructionsOuterObj => {
                                            if (prevImagePromptInstructionsOuterObj[usedId] === undefined) return prevImagePromptInstructionsOuterObj

                                            //react refresh
                                            const newImagePromptInstructionsOuterObj = { ...prevImagePromptInstructionsOuterObj }
                                            newImagePromptInstructionsOuterObj[usedId] = { ...newImagePromptInstructionsOuterObj[usedId] }

                                            newImagePromptInstructionsOuterObj[usedId].prompt = e.target.value

                                            return newImagePromptInstructionsOuterObj
                                        })
                                    }}
                                />
                            </div>
                        )}
                    />

                    {seenImageInstructionsObj.imageSrc !== "" && (
                        <>
                            <label>Image preview</label>

                            <Image alt={`${usedId} image preview`} width={500} height={500} src={`/api/previewImages/download?src=${seenImageInstructionsObj.imageSrc}`} style={{ objectFit: "contain", width: "100%" }} />
                        </>
                    )}

                    <button className='button1'
                        onClick={async () => {
                            toast.success(`${seenImageInstructionsObj.mode === "edit" ? "editing" : "generating"} image!`)

                            await generateImage()

                            toast.success(`finished!s`)
                        }}
                    >
                        {seenImageInstructionsObj.mode === "edit" ? seenImageInstructionsObj.loading ? "editing..." : "edit" : seenImageInstructionsObj.loading ? "generating..." : "generate"}
                    </button>
                </div>
            )}
        />
    )
}
