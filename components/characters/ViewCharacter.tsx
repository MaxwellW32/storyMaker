import { characterType } from '@/types'
import React from 'react'

export default function ViewCharacter({ seenCharacter, selectionAction, viewAll = true }: { seenCharacter: characterType, selectionAction?: (eachCharacter: characterType) => void, viewAll?: boolean }) {
    return (
        <div>
            <p>name: {seenCharacter.name}</p>

            {viewAll && (
                <>
                    <p>age: {seenCharacter.age}</p>
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
