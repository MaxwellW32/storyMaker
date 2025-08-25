import { locationType } from '@/types'
import React from 'react'
import styles from "./style.module.css"
import Image from 'next/image'

export default function ViewLocation({ seenLocation, selectionAction }: { seenLocation: locationType, selectionAction?: (eachLocation: locationType) => void }) {

    return (
        <div className={`container ${styles.cont}`}>
            <h5>{seenLocation.name}</h5>
            <p>{seenLocation.description}</p>

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
