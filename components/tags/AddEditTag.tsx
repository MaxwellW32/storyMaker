"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { newTagSchema, newTagType, tagSchema, updateTagSchema, tagType } from '@/types'
import toast from 'react-hot-toast'
import { addTag, updateTag } from '@/serverFunctions/handleTags'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { deepClone } from '@/utility/utility'

export default function AddEditTag({ sentTag, submissionAction }: { sentTag?: tagType, submissionAction?: () => void }) {
    const initialFormObj: newTagType = {
        name: "",
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<tagType>>(deepClone(sentTag === undefined ? initialFormObj : updateTagSchema.parse(sentTag)))

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in keyof tagType]: string }>>({})

    //handle changes from above
    useEffect(() => {
        if (sentTag === undefined) return

        formObjSet(deepClone(updateTagSchema.parse(sentTag)))

    }, [sentTag])

    function checkIfValid(seenFormObj: Partial<tagType>, seenName: keyof tagType) {
        // @ts-expect-error type
        const testSchema = tagSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

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

            //new tag
            if (sentTag === undefined) {
                const validatedNewTag = newTagSchema.parse(formObj)

                //send up to server
                await addTag(validatedNewTag)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedTag = updateTagSchema.parse(formObj)

                //update
                await updateTag(sentTag.id, validatedUpdatedTag)

                toast.success("tag updated")
            }

            if (submissionAction !== undefined) {
                submissionAction()
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    return (
        <form className={styles.form} action={() => { }}>
            {formObj.name !== undefined && (
                <>
                    <TextInput
                        name={"name"}
                        value={formObj.name}
                        type={"text"}
                        label={"tag name"}
                        placeHolder={"enter tag name"}
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

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentTag !== undefined ? "update" : "submit"}</button>
        </form>
    )
}