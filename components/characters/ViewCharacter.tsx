import { characterType } from '@/types'
import React from 'react'

export default function ViewCharacter({ seenCharacter, selectionAction }: { seenCharacter: characterType, selectionAction?: (eachCharacter: characterType) => void, }) {
    return (
        <div>
            {JSON.stringify(seenCharacter, null, 2)}

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenCharacter) }}
                >select</button>
            )}
        </div>
    )
}
