import { characterType } from '@/types'
import React from 'react'
import styles from "./style.module.css"
import Image from 'next/image'

export default function ViewCharacter({ seenCharacter, selectionAction, viewAll = true }: { seenCharacter: characterType, selectionAction?: (eachCharacter: characterType) => void, viewAll?: boolean }) {
    //get tags
    //get emotions
    //get user

    return (
        <div className={`container ${styles.cont}`}>
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

                    <div className='container'>
                        <p>appearance:</p>

                        <div className='gridColumns snap'>
                            {seenCharacter.appearances.map(eachAppearance => {
                                return (
                                    <div key={eachAppearance.id}>
                                        <Image alt={`${eachAppearance.file.fileName} image`} width={500} height={500} src={`/api/characters/images/download?characterId=${seenCharacter.id}&src=${eachAppearance.file.src}`} style={{ objectFit: "contain", width: "100%" }} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

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
