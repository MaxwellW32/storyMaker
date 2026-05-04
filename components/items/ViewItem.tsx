import React from 'react'
import styles from "./style.module.css"
import { withId } from '@/types'

export default function ViewItems<T extends withId>({ itemObjs, selectionAction, selectedIds }: { itemObjs: { item: T, Element: React.JSX.Element }[], selectionAction?: (eachItem: T) => void, selectedIds?: withId["id"][] }) {
    return (
        <div className='container'>
            <div className='gridColumns snap'>
                {itemObjs.map(eachItemObj => {
                    return (
                        <ViewItem key={eachItemObj.item.id} itemObj={eachItemObj} selectedIds={selectedIds}
                            selectionAction={selectionAction}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export function ViewItem<T extends withId>({ itemObj, selectionAction, selectedIds = [] }: {
    itemObj: {
        item: T,
        Element: React.JSX.Element
    }, selectionAction?: (eachItem: T) => void, selectedIds?: (string | number)[]
}) {
    const selected = selectedIds.includes(itemObj.item.id)

    return (
        <div className={`container ${styles.item} ${selected ? styles.selected : ""}`}>
            {selectionAction !== undefined && (
                <button className='button1' style={{ backgroundColor: selected ? "var(--c2)" : "" }}
                    onClick={() => { selectionAction(itemObj.item) }}
                >{selected ? "selected" : "select"}</button>
            )}

            {itemObj.Element}
        </div>
    )
}