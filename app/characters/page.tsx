"use client"
import Search from '@/components/search/Search'
import { characterType, searchObjType } from '@/types'
import Link from 'next/link'
import React, { useState } from 'react'
import styles from "./page.module.css"
import { getCharacters } from '@/serverFunctions/handleCharacters'
import ViewCharacter from '@/components/characters/ViewCharacter'
import { useSession } from 'next-auth/react'

export default function Page() {
    const { data: session } = useSession()

    const [charactersSearchObj, charactersSearchObjSet] = useState<searchObjType<characterType>>({
        searchItems: [],
    })

    return (
        <main className={styles.main}>
            <h1>Characters</h1>

            <Link href={"/characters/new"} style={{ justifySelf: "flex-end" }}>
                <button className='button1'>make new</button>
            </Link>

            <Search
                searchObj={charactersSearchObj}
                searchObjSet={charactersSearchObjSet}
                searchFunc={async (seenFilters) => {
                    return await getCharacters({ ...seenFilters }, {}, charactersSearchObj.limit, charactersSearchObj.offset)
                }}
                showPage={true}
                searchFilters={{
                    name: {
                        value: "",
                    }
                }}
            />

            {charactersSearchObj.loading && (<p>loading...</p>)}

            {charactersSearchObj.searchItems.length > 0 && (
                <div className="container">
                    <div className='gridColumns snap'>
                        {charactersSearchObj.searchItems.map(eachCharacter => {
                            return (
                                <div key={eachCharacter.id} className='container'>
                                    <ViewCharacter seenCharacter={eachCharacter} />

                                    {session !== null && eachCharacter.userId === session.user.id && (
                                        <Link href={`characters/edit/${eachCharacter.id}`}>
                                            <button className='button1'>edit</button>
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </main>
    )
}