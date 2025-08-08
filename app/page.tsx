"use client"
import Search from '@/components/search/Search'
import { projectType, searchObjType } from '@/types'
import { formatLocalDateTime } from '@/utility/utility'
import Link from 'next/link'
import React, { useState } from 'react'
import styles from "./page.module.css"
import { getProjects } from '@/serverFunctions/handleProjects'
import { useSession } from 'next-auth/react'

export default function Page() {
    const { data: session } = useSession()

    const [projectsSearchObj, projectsSearchObjSet] = useState<searchObjType<projectType>>({
        searchItems: [],
    })

    return (
        <main className={styles.main}>
            {session !== null ? (
                <>
                    <h1>Projects</h1>

                    <Link href={"/projects/new"} style={{ justifySelf: "flex-end" }}>
                        <button className='button1'>make new</button>
                    </Link>

                    <Search
                        searchObj={projectsSearchObj}
                        searchObjSet={projectsSearchObjSet}
                        searchFunc={async (seenFilters) => {
                            return await getProjects({ ...seenFilters, userId: session.user.id }, {}, projectsSearchObj.limit, projectsSearchObj.offset)
                        }}
                        showPage={true}
                        searchFilters={{
                            name: {
                                value: "",
                            }
                        }}
                    />

                    {projectsSearchObj.loading && (<p>loading...</p>)}

                    {projectsSearchObj.searchItems.length > 0 && (
                        <div className="container">
                            <div className='gridColumns snap'>
                                {projectsSearchObj.searchItems.map(eachProject => {
                                    return (
                                        <div key={eachProject.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                            <p>{formatLocalDateTime(eachProject.dateCreated)}</p>

                                            <Link href={`projects/view/${eachProject.id}`}>
                                                <h2>{eachProject.name}</h2>
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    Please Login to get started
                </>
            )}
        </main>
    )
}