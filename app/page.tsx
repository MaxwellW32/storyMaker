"use client"
import Search from '@/components/search/Search'
import { getProjects } from '@/serverFunctions/handleProjects'
import { projectType, searchObjType } from '@/types'
import { formatLocalDateTime } from '@/utility/utility'
import Link from 'next/link'
import React, { useState } from 'react'

export default function Page() {
    const [projectsSearchObj, projectsSearchObjSet] = useState<searchObjType<projectType>>({
        searchItems: [],
    })

    return (
        <main>
            <h1>Projects</h1>

            <Link href={"/projects/new"} style={{ justifySelf: "flex-end" }}>
                <button className='button1'>make new</button>
            </Link>

            <Search
                searchObj={projectsSearchObj}
                searchObjSet={projectsSearchObjSet}
                searchFunc={async (seenFilters) => {
                    return await getProjects({ ...seenFilters }, projectsSearchObj.limit, projectsSearchObj.offset)
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
                <div style={{ display: "grid", alignContent: "flex-start" }}>
                    <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", gridAutoFlow: "column", gridAutoColumns: "min(90%, 350px)", overflow: "auto" }} className='snap'>
                        {projectsSearchObj.searchItems.map(eachProject => {
                            return (
                                <div key={eachProject.id} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
                                    <h2>{eachProject.name}</h2>

                                    <p>{formatLocalDateTime(eachProject.dateCreated)}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </main>
    )
}