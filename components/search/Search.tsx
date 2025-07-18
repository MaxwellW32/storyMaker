"use client"
import { allFilterType, searchObjType } from '@/types'
import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ShowMore from '../showMore/ShowMore'
import { consoleAndToastError } from '@/useful/consoleErrorWithToast'
import { spaceCamelCase } from '@/utility/utility'

type searchFiltersType<T> = {
    [K in keyof T]?: {
        hidden?: true,
        active?: true, //start off - if undefined dont use 
        value: T[K]
    }
}

export default function Search<T>({ searchObj, searchObjSet, searchFunc, showPage, searchFilters, handleResults = true, autoSearch = undefined }: {
    searchObj: searchObjType<T>, searchObjSet: React.Dispatch<React.SetStateAction<searchObjType<T>>>, searchFunc: (allFilters: allFilterType) => Promise<T[]>, showPage?: boolean, searchFilters?: searchFiltersType<T>, handleResults?: boolean,
    autoSearch?: true
}) {
    const wantsToSearchAgain = useRef(false)

    const [pageIndex, pageIndexSet] = useState<number | undefined>()
    const pageDebounce = useRef<NodeJS.Timeout | undefined>(undefined)

    const searchDebounce = useRef<NodeJS.Timeout | undefined>(undefined)

    const [activeSearchFilters, activeSearchFiltersSet] = useState<searchFiltersType<T>>(searchFilters === undefined ? {} : { ...searchFilters })

    //if auto search - search once
    useEffect(() => {
        if (!autoSearch) return

        handleSearch()
    }, [])

    //respond to next/prev incrementers
    useEffect(() => {
        //only run when button clicked
        if (!wantsToSearchAgain.current) return
        wantsToSearchAgain.current = false

        handleSearch()

    }, [searchObj.offset])

    //respond to want to refresh all
    useEffect(() => {
        //run everytime it flips
        if (searchObj.refreshAll === undefined) return

        //reset refreshAll
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            newSearchObj.refreshAll = false

            return newSearchObj
        })

        handleSearch(false)

    }, [searchObj.refreshAll])

    //respond to search filter changes from user
    useEffect(() => {
        if (searchFilters == undefined) return

        //only run when button clicked
        if (!wantsToSearchAgain.current) return
        wantsToSearchAgain.current = false

        if (searchDebounce.current) clearTimeout(searchDebounce.current)
        searchDebounce.current = setTimeout(async () => {
            handleSearch(false)
        }, 1000);

    }, [activeSearchFilters])

    function handleOffset(option: "increment" | "decrement") {
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            //set default values
            if (newSearchObj.offset === undefined) newSearchObj.offset = 0
            if (newSearchObj.incrementOffsetBy === undefined) newSearchObj.incrementOffsetBy = 50

            //dynamic change value for option
            const multiplier = option === "increment" ? 1 : -1

            //increase the offset
            newSearchObj.offset = newSearchObj.offset += (newSearchObj.incrementOffsetBy * multiplier)

            //ensure range limit
            if (newSearchObj.offset < 0) {
                newSearchObj.offset = 0
            }

            //update the page count
            pageIndexSet(newSearchObj.offset / newSearchObj.incrementOffsetBy)

            return newSearchObj
        })
    }

    function changePage(newPageIndex: number) {
        searchObjSet(prevSearchObj => {
            const newSearchObj = { ...prevSearchObj }

            //set default values
            if (newSearchObj.offset === undefined) return prevSearchObj
            if (newSearchObj.incrementOffsetBy === undefined) return prevSearchObj

            //current offset value / incrementOffsetby = page index - e.g 100 / 50 = 2

            //increase the offset
            newSearchObj.offset = newPageIndex * newSearchObj.incrementOffsetBy

            return newSearchObj
        })

        //allow new search
        wantsToSearchAgain.current = true
    }

    async function handleSearch(showExtra = true) {
        try {
            //notify user search is happening
            if (showExtra) {
                toast.success("searching")
            }

            //get bulk results
            const filtersOnlyPre = Object.entries(activeSearchFilters).map(eachEntry => {
                const seenKey = eachEntry[0] as keyof searchFiltersType<T>
                const seenValue = eachEntry[1] as searchFiltersType<T>[keyof T]

                if (seenValue === undefined) return null

                //ensure filter active
                if (seenValue.active !== true) return null

                return [seenKey, seenValue.value]
            })

            const filtersOnly = Object.fromEntries(filtersOnlyPre.filter(each => each !== null)) as allFilterType

            //set loading
            searchObjSet(prevSearchObj => {
                const newSearchObj = { ...prevSearchObj }

                newSearchObj.loading = true

                return newSearchObj
            })

            //search
            const results = await searchFunc(filtersOnly)

            //update loading
            searchObjSet(prevSearchObj => {
                const newSearchObj = { ...prevSearchObj }

                newSearchObj.loading = undefined

                return newSearchObj
            })

            if (handleResults) {
                //set results
                if (results.length === 0) {
                    toast.error("not seeing anything")

                    return
                }

                //update state
                searchObjSet(prevSearchObj => {
                    const newSearchObj = { ...prevSearchObj }

                    newSearchObj.searchItems = results

                    return newSearchObj
                })
            }

        } catch (error) {
            consoleAndToastError(error)
        }
    }

    function runAllOnFilters() {
        wantsToSearchAgain.current = true
    }

    return (
        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
                <button className='button1'
                    onClick={async () => {
                        handleSearch()
                    }}
                >search</button>

                <button className='button2'
                    onClick={() => {
                        //decrease offset
                        handleOffset("decrement")

                        //allow new search
                        wantsToSearchAgain.current = true
                    }}
                >prev</button>

                <button className='button2'
                    onClick={() => {
                        //increase offset
                        handleOffset("increment")

                        //allow new search
                        wantsToSearchAgain.current = true
                    }}
                >next</button>

                {showPage && pageIndex !== undefined && searchObj.offset !== undefined && searchObj.incrementOffsetBy !== undefined && (
                    <>
                        <p>page</p>

                        <input type='text' value={`${pageIndex + 1}`} style={{ width: "4ch", padding: "0 .5rem", textAlign: "center" }}
                            onChange={(e) => {
                                //validate entered num
                                let seenIndex = parseInt(e.target.value)
                                if (isNaN(seenIndex)) {
                                    seenIndex = 0

                                } else {
                                    //user value valid
                                    //decrement whatever the user sent in
                                    seenIndex -= 1
                                }

                                if (seenIndex < 0) seenIndex = 0

                                pageIndexSet(seenIndex)

                                //set the offset to that page
                                if (pageDebounce.current) clearTimeout(pageDebounce.current)

                                pageDebounce.current = setTimeout(() => {
                                    changePage(seenIndex)
                                }, 1000);
                            }}
                        />
                    </>
                )}
            </div>

            {searchFilters !== undefined && (//user sent search filters so display them
                <ShowMore
                    label='Filters'
                    content={
                        <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingR)", paddingBlock: "1rem", position: "relative" }}>
                            {Object.entries(activeSearchFilters).map((eachEntry) => {
                                const eachFilterKey = eachEntry[0] as keyof searchFiltersType<T>
                                const eachFilterValue = eachEntry[1] as searchFiltersType<T>[keyof T]
                                const eachFilterKeyStringType = eachFilterKey as string

                                if (eachFilterValue === undefined) return null
                                if (eachFilterValue.hidden) return null

                                const label = spaceCamelCase(eachFilterKeyStringType.charAt(0).toUpperCase() + eachFilterKeyStringType.slice(1))

                                return (
                                    <div key={eachFilterKeyStringType} style={{ display: "grid", alignContent: "flex-start", gap: ".5rem" }}>
                                        <label>{label}</label>

                                        <div style={{ display: "grid", alignContent: "flex-start", gridTemplateColumns: "1fr auto", gap: ".5rem" }}>
                                            {typeof eachFilterValue.value === "boolean" && (
                                                <button className='button1' style={{ backgroundColor: activeSearchFilters[eachFilterKey] ? "" : "rgb(var(--color2))" }}
                                                    onClick={() => {
                                                        runAllOnFilters()

                                                        activeSearchFiltersSet(prevSearchFilters => {
                                                            const newSearchFilters = { ...prevSearchFilters }
                                                            if (newSearchFilters[eachFilterKey] === undefined) return prevSearchFilters

                                                            newSearchFilters[eachFilterKey] = { ...newSearchFilters[eachFilterKey] }

                                                            //@ts-expect-error type
                                                            newSearchFilters[eachFilterKey].value = !newSearchFilters[eachFilterKey].value

                                                            return newSearchFilters
                                                        })
                                                    }}
                                                >{label}</button>
                                            )}

                                            {(typeof eachFilterValue.value === "string" || typeof eachFilterValue.value === "number") && (
                                                <input type={typeof eachFilterValue.value === "number" ? "number" : "text"} value={eachFilterValue.value} placeholder={`enter ${label}`}
                                                    onChange={(e) => {
                                                        let seenText: string | number = e.target.value

                                                        if (typeof eachFilterValue.value === "number") {
                                                            seenText = parseInt(seenText)

                                                            if (isNaN(seenText)) {
                                                                seenText = 0
                                                            }
                                                        }

                                                        runAllOnFilters()

                                                        activeSearchFiltersSet(prevSearchFilters => {
                                                            const newSearchFilters = { ...prevSearchFilters }
                                                            if (newSearchFilters[eachFilterKey] === undefined) return prevSearchFilters
                                                            newSearchFilters[eachFilterKey] = { ...newSearchFilters[eachFilterKey] }

                                                            //ensure filter is active if typing
                                                            newSearchFilters[eachFilterKey].active = seenText === "" ? undefined : true

                                                            //@ts-expect-error type
                                                            newSearchFilters[eachFilterKey].value = seenText

                                                            return newSearchFilters
                                                        })
                                                    }}
                                                />
                                            )}

                                            <button
                                                onClick={() => {
                                                    runAllOnFilters()

                                                    activeSearchFiltersSet(prevSearchFilters => {
                                                        const newSearchFilters = { ...prevSearchFilters }
                                                        if (newSearchFilters[eachFilterKey] === undefined) return prevSearchFilters
                                                        newSearchFilters[eachFilterKey] = { ...newSearchFilters[eachFilterKey] }

                                                        newSearchFilters[eachFilterKey].active = newSearchFilters[eachFilterKey].active === undefined ? true : undefined

                                                        if (newSearchFilters[eachFilterKey].active) {
                                                            toast.success("enabled")
                                                        }

                                                        return newSearchFilters
                                                    })
                                                }}
                                            >{eachFilterValue.active ? (
                                                <svg style={{ width: "1.5rem", fill: "rgb(var(--color1)" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
                                            ) : (
                                                <svg style={{ width: "1.5rem", fill: "rgb(var(--shade3))" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm79 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>
                                            )}</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    }
                />
            )}
        </div>
    )
}