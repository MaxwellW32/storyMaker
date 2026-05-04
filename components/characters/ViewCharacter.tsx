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
            <h5>{seenCharacter.name} - age {seenCharacter.age}</h5>

            <div className='container'>
                <h3>appearances:</h3>

                <div className='gridColumns snap'>
                    {seenCharacter.appearances.map(eachAppearance => {
                        return (
                            <div key={eachAppearance.id}>
                                <h3>{eachAppearance.name}</h3>

                                <Image alt={`${eachAppearance.file.fileName} image`} width={500} height={500} src={`/api/characters/images/download?characterId=${seenCharacter.id}&src=${eachAppearance.file.src}`} style={{ objectFit: "contain", width: "100%" }} />
                            </div>
                        )
                    })}
                </div>
            </div>

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
