"use client"
import React, { useEffect, useState } from 'react'
import styles from "./style.module.css"
import { newProjectSchema, newProjectType, projectSchema, projectType, updateProjectSchema } from '@/types'
import toast from 'react-hot-toast'
import { addProjects, updateProjects } from '@/serverFunctions/handleProjects'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import TextInput from '../textInput/TextInput'
import { deepClone } from '@/utility/utility'
import { useRouter } from 'next/navigation'

export default function AddEditProject({ sentProject, submissionAction }: { sentProject?: projectType, submissionAction?: () => void }) {
    const router = useRouter()

    const initialFormObj: newProjectType = {
        name: ""
    }

    //assign either a new form, or the safe values on an update form
    const [formObj, formObjSet] = useState<Partial<projectType>>(deepClone(sentProject === undefined ? initialFormObj : updateProjectSchema.parse(sentProject)))

    type projectKeys = keyof projectType
    const [formErrors, formErrorsSet] = useState<Partial<{ [key in projectKeys]: string }>>({})

    //handle changes from above
    useEffect(() => {
        if (sentProject === undefined) return

        formObjSet(deepClone(updateProjectSchema.parse(sentProject)))

    }, [sentProject])

    function checkIfValid(seenFormObj: Partial<projectType>, seenName: keyof projectType) {
        // @ts-expect-error type
        const testSchema = projectSchema.pick({ [seenName]: true }).safeParse(seenFormObj);

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

            //new department
            if (sentProject === undefined) {
                const validatedNewProject = newProjectSchema.parse(formObj)

                //send up to server
                const addedProject = await addProjects(validatedNewProject)

                toast.success("submitted")
                formObjSet(deepClone(initialFormObj))

                setTimeout(() => {
                    router.push(`/projects/view/${addedProject.id}`)
                }, 1000);

            } else {
                //validate
                const validatedUpdatedProject = updateProjectSchema.parse(formObj)

                //update
                await updateProjects(sentProject.id, validatedUpdatedProject)

                toast.success("project updated")
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
                        label={"project name"}
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

            <button className='button1' style={{ justifySelf: "center" }}
                onClick={handleSubmit}
            >{sentProject !== undefined ? "update" : "submit"}</button>
        </form>
    )
}