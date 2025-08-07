import { characterType } from '@/types'
import React from 'react'

export default function ViewCharacter({ seenCharacter, selectionAction, viewAll = true }: { seenCharacter: characterType, selectionAction?: (eachCharacter: characterType) => void, viewAll?: boolean }) {
    //get tags
    //get emotions
    //get user

    return (
        <div>
            <p>name: {seenCharacter.name}</p>
            <p>age: {seenCharacter.age}</p>

            {viewAll && (
                <>
                    <p>voiceId: {seenCharacter.voiceId}</p>
                    <p>personality: {seenCharacter.personality}</p>
                    <p>toneOfVoice: {seenCharacter.toneOfVoice}</p>
                    <p>dialogueStyle: {seenCharacter.dialogueStyle}</p>
                    <p>alignment: {seenCharacter.alignment}</p>
                    <p>goal: {seenCharacter.goal}</p>
                    <p>fear: {seenCharacter.fear}</p>
                    <p>fatalFlaw: {seenCharacter.fatalFlaw}</p>
                    <p>backstory: {seenCharacter.backstory}</p>
                    <p>occupation: {seenCharacter.occupation}</p>
                    <p>location: {seenCharacter.location}</p>
                    <p>appearance: {seenCharacter.appearance}</p>
                    <p>archetype: {seenCharacter.archetype}</p>
                </>
            )}

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenCharacter) }}
                >select</button>
            )}
        </div>
    )
}
