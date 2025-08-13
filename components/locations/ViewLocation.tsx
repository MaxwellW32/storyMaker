import { locationType } from '@/types'
import React from 'react'
import styles from "./style.module.css"

export default function ViewLocation({ seenLocation, selectionAction }: { seenLocation: locationType, selectionAction?: (eachLocation: locationType) => void }) {
    //get tags
    //get emotions
    //get user

    return (
        <div className={`container ${styles.cont}`}>
            <p>name: {seenLocation.name}</p>
            <p>description: {seenLocation.description}</p>

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenLocation) }}
                >select</button>
            )}
        </div>
    )
}
