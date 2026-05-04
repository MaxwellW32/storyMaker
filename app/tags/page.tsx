"use client"
import Search from '@/components/search/Search'
import { tagType, searchObjType } from '@/types'
import Link from 'next/link'
import React, { useState } from 'react'
import styles from "./page.module.css"
import { getTags } from '@/serverFunctions/handleTags'
import ViewTag from '@/components/tags/ViewTag'

export default function Page() {
    const [tagsSearchObj, tagsSearchObjSet] = useState<searchObjType<tagType>>({
        searchItems: [],
    })

    return (
        <main className={styles.main}>
            <h1>Tags</h1>

            <Link href={"/tags/new"} style={{ justifySelf: "flex-end" }}>
                <button className='button1'>make new</button>
            </Link>

            <Search
                searchObj={tagsSearchObj}
                searchObjSet={tagsSearchObjSet}
                searchFunc={async (seenFilters) => {
                    return await getTags({ ...seenFilters }, {}, tagsSearchObj.limit, tagsSearchObj.offset)
                }}
                showPage={true}
                searchFilters={{
                    name: {
                        value: "",
                    }
                }}
            />

            {tagsSearchObj.loading && (<p>loading...</p>)}

            {tagsSearchObj.searchItems.length > 0 && (
                <div className="container">
                    <div className='gridColumns snap'>
                        {tagsSearchObj.searchItems.map(eachTag => {
                            return (
                                <div key={eachTag.id} className='container'>
                                    <ViewTag seenTag={eachTag} />

                                    <Link href={`tags/edit/${eachTag.id}`}>
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