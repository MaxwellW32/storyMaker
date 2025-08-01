"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { newCharacterSchema, newCharacterType, characterSchema, characterType, updateCharacterSchema } from '@/types'
import toast from 'react-hot-toast'
import { addCharacter, updateCharacter } from '@/serverFunctions/handleCharacters'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../inputs/textInput/TextInput'
import { deepClone } from '@/utility/utility'

export default function AddEditCharacter({ sentCharacter, submissionAction }: { sentCharacter?: characterType, submissionAction?: () => void }) {
    const initialFormObj: newCharacterType = {
        name: "",
        age: 20,
        userId: "dummyData"
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<characterType>>(deepClone(sentCharacter === undefined ? initialFormObj : updateCharacterSchema.parse(sentCharacter)))

    const [formErrors, formErrorsSet] = useState<Partial<{ [key in keyof characterType]: string }>>({})

    //handle changes from above
    useEffect(() => {
        if (sentCharacter === undefined) return

        formObjSet(deepClone(updateCharacterSchema.parse(sentCharacter)))

    }, [sentCharacter])

    function checkIfValid(seenFormObj: Partial<characterType>, seenName: keyof characterType) {
        // @ts-expect-error type
        const testSchema = characterSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

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

            //new character
            if (sentCharacter === undefined) {
                const validatedNewCharacter = newCharacterSchema.parse(formObj)

                //send up to server
                await addCharacter(validatedNewCharacter)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

            } else {
                //validate
                const validatedUpdatedCharacter = updateCharacterSchema.parse(formObj)

                //update
                await updateCharacter(sentCharacter.id, validatedUpdatedCharacter)

                toast.success("character updated")
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
                        label={"character name"}
                        placeHolder={"enter project name"}
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

            {formObj.age !== undefined && (
                <>
                    <TextInput
                        name={"age"}
                        value={`${formObj.age}`}
                        type={"text"}
                        label={"character age"}
                        placeHolder={"enter character age"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            formObjSet(prevFormObj => {
                                const newFormObj = { ...prevFormObj }
                                if (newFormObj.age === undefined) return prevFormObj

                                const seenNum = parseFloat(e.target.value)
                                if (isNaN(seenNum)) return prevFormObj

                                newFormObj.age = seenNum

                                return newFormObj
                            })
                        }}
                        onBlur={() => { checkIfValid(formObj, "age") }}
                        errors={formErrors["age"]}
                    />
                </>
            )}

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentCharacter !== undefined ? "update" : "submit"}</button>
        </form>
    )
}