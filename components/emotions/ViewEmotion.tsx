import { emotionType } from '@/types'
import React from 'react'

export default function ViewEmotion({ seenEmotion, selectionAction, }: { seenEmotion: emotionType, selectionAction?: (eachEmotion: emotionType) => void, }) {
    return (
        <div>
            <p>{seenEmotion.type}</p>

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenEmotion) }}
                >select</button>
            )}
        </div>
    )
}