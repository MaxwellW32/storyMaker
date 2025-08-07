"use client"
import Search from '@/components/search/Search'
import { emotionType, searchObjType } from '@/types'
import Link from 'next/link'
import React, { useState } from 'react'
import styles from "./page.module.css"
import { getEmotions } from '@/serverFunctions/handleEmotions'
import ViewEmotion from '@/components/emotions/ViewEmotion'

export default function Page() {
    const [emotionsSearchObj, emotionsSearchObjSet] = useState<searchObjType<emotionType>>({
        searchItems: [],
    })

    return (
        <main className={styles.main}>
            <h1>Emotions</h1>

            <Link href={"/emotions/new"} style={{ justifySelf: "flex-end" }}>
                <button className='button1'>make new</button>
            </Link>

            <Search
                searchObj={emotionsSearchObj}
                searchObjSet={emotionsSearchObjSet}
                searchFunc={async (seenFilters) => {
                    return await getEmotions({ ...seenFilters }, {}, emotionsSearchObj.limit, emotionsSearchObj.offset)
                }}
                showPage={true}
                searchFilters={{
                    type: {
                        value: "",
                    }
                }}
            />

            {emotionsSearchObj.loading && (<p>loading...</p>)}

            {emotionsSearchObj.searchItems.length > 0 && (
                <div className="container">
                    <div className='gridColumns snap'>
                        {emotionsSearchObj.searchItems.map(eachEmotion => {
                            return (
                                <div key={eachEmotion.type} className='container'>
                                    <ViewEmotion seenEmotion={eachEmotion} />

                                    <Link href={`emotions/edit/${eachEmotion.type}`}>
                                        <button className='button1'>edit</button>
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </main>
    )
}