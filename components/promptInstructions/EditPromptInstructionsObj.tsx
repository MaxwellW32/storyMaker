import { gptPromptInstructionsObjType } from '@/types'
import React from 'react'
import ShowMore from '../showMore/ShowMore'
import TextArea from '../inputs/textArea/TextArea'

export default function EditPromptInstructionsObj({ starterInstructionsObj, starterInstructionsObjSet, manualMake, generateMake }: { starterInstructionsObj: gptPromptInstructionsObjType, starterInstructionsObjSet: React.Dispatch<React.SetStateAction<gptPromptInstructionsObjType>>, manualMake: () => Promise<void>, generateMake: () => Promise<void> }) {
    return (
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
                                    name="starterInstructionsObjBaseInstructions"
                                    value={starterInstructionsObj.baseInstructions}
                                    placeHolder="Describe how the gpt works..."
                                    onChange={(e) => {
                                        starterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                                            const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }

                                            newAppearanceStarterInstructionsObj.baseInstructions = e.target.value

                                            return newAppearanceStarterInstructionsObj
                                        })
                                    }}
                                />

                            )}
                        />

                        <label>prompt</label>
                        <TextArea
                            name="starterInstructionsObjPrompt"
                            value={starterInstructionsObj.prompt}
                            placeHolder="Enter your prompt for the new appearance..."
                            onChange={(e) => {
                                starterInstructionsObjSet(prevAppearanceStarterInstructionsObj => {
                                    const newAppearanceStarterInstructionsObj = { ...prevAppearanceStarterInstructionsObj }

                                    newAppearanceStarterInstructionsObj.prompt = e.target.value

                                    return newAppearanceStarterInstructionsObj
                                })
                            }}
                        />

                        <button className='button1'
                            onClick={generateMake}
                        >generate</button>
                    </>
                )}
            />

            <ShowMore
                label='manual'
                content={(
                    <>
                        <button className='button1'
                            onClick={manualMake}
                        >make new</button>
                    </>
                )}
            />
        </div>
    )
}
