"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { newEmotionSchema, newEmotionType, emotionSchema, updateEmotionSchema, emotionType } from '@/types'
import toast from 'react-hot-toast'
import { addEmotion, updateEmotion } from '@/serverFunctions/handleEmotions'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { deepClone } from '@/utility/utility'

export default function AddEditEmotion({ sentEmotion, submissionAction }: { sentEmotion?: emotionType, submissionAction?: () => void }) {
    const initialFormObj: newEmotionType = {
        type: "",
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<emotionType>>(deepClone(sentEmotion === undefined ? initialFormObj : updateEmotionSchema.parse(sentEmotion)))

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in keyof emotionType]: string }>>({})

    //handle changes from above
    useEffect(() => {
        if (sentEmotion === undefined) return

        formObjSet(deepClone(updateEmotionSchema.parse(sentEmotion)))

    }, [sentEmotion])

    function checkIfValid(seenFormObj: Partial<emotionType>, seenName: keyof emotionType) {
        // @ts-expect-error type
        const testSchema = emotionSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

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

            //new emotion
            if (sentEmotion === undefined) {
                const validatedNewEmotion = newEmotionSchema.parse(formObj)

                //send up to server
                await addEmotion(validatedNewEmotion)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedEmotion = updateEmotionSchema.parse(formObj)

                //update
                await updateEmotion(sentEmotion.type, validatedUpdatedEmotion)

                toast.success("emotion updated")
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
            {formObj.type !== undefined && (
                <>
                    <TextInput
                        name={"type"}
                        value={formObj.type}
                        type={"text"}
                        label={"emotion type"}
                        placeHolder={"enter emotion type"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.type === undefined) return prevFormObj

                                newFormObj.type = e.target.value

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "type") }}
                        errors={formErrors["type"]}
                    />
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentEmotion !== undefined ? "update" : "submit"}</button>
        </form>
    )
}