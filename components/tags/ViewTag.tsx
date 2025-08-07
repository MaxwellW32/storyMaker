import { tagType } from '@/types'
import React from 'react'

export default function ViewTag({ seenTag, selectionAction, }: { seenTag: tagType, selectionAction?: (eachTag: tagType) => void, }) {
    return (
        <div>
            <p>{seenTag.name}</p>

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenTag) }}
                >select</button>
            )}
        </div>
    )
}