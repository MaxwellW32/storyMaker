import { locationType } from '@/types'
import React from 'react'
import styles from "./style.module.css"
import Image from 'next/image'

export default function ViewLocation({ seenLocation, selectionAction }: { seenLocation: locationType, selectionAction?: (eachLocation: locationType) => void }) {
    //get tags
    //get emotions
    //get user

    return (
        <div className={`container ${styles.cont}`}>
            <p>name: {seenLocation.name}</p>
            <p>description: {seenLocation.description}</p>

            <div className='container'>
                <h3>views:</h3>

                <div className='gridColumns snap'>
                    {seenLocation.views.map(eachView => {
                        return (
                            <div key={eachView.id}>
                                <h3>{eachView.name}</h3>

                                <Image alt={`${eachView.name} view image`} width={500} height={500} src={`/api/locations/images/download?locationId=${seenLocation.id}&src=${eachView.file.src}`} style={{ objectFit: "contain", width: "100%" }} />
                            </div>
                        )
                    })}
                </div>
            </div>

            {selectionAction !== undefined && (
                <button className='button1'
                    onClick={() => { selectionAction(seenLocation) }}
                >select</button>
            )}
        </div>
    )
}
