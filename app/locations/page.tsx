"use client"
import Search from '@/components/search/Search'
import { locationType, searchObjType } from '@/types'
import Link from 'next/link'
import React, { useState } from 'react'
import styles from "./page.module.css"
import { getLocations } from '@/serverFunctions/handleLocations'
import ViewLocation from '@/components/locations/ViewLocation'
import { useSession } from 'next-auth/react'

export default function Page() {
    const { data: session } = useSession()

    const [locationsSearchObj, locationsSearchObjSet] = useState<searchObjType<locationType>>({
        searchItems: [],
    })

    return (
        <main className={styles.main}>
            <h1>Locations</h1>

            <Link href={"/locations/new"} style={{ justifySelf: "flex-end" }}>
                <button className='button1'>make new</button>
            </Link>

            <Search
                searchObj={locationsSearchObj}
                searchObjSet={locationsSearchObjSet}
                searchFunc={async (seenFilters) => {
                    return await getLocations({ ...seenFilters }, {}, locationsSearchObj.limit, locationsSearchObj.offset)
                }}
                showPage={true}
                searchFilters={{
                    name: {
                        value: "",
                    }
                }}
            />

            {locationsSearchObj.loading && (<p>loading...</p>)}

            {locationsSearchObj.searchItems.length > 0 && (
                <div className="container">
                    <div className='gridColumns snap'>
                        {locationsSearchObj.searchItems.map(eachLocation => {
                            return (
                                <div key={eachLocation.id} className='container'>
                                    <ViewLocation seenLocation={eachLocation} />

                                    {session !== null && eachLocation.userId === session.user.id && (
                                        <Link href={`locations/edit/${eachLocation.id}`}>
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