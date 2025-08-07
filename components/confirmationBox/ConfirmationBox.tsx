"use client"
import React, { useState } from 'react'
import toast from 'react-hot-toast'

export default function ConfirmationBox({ text, confirmationText, successMessage, runAction, float = false, iconName, ...elProps }: { text: string, confirmationText: string, successMessage: string, runAction: () => void, float?: boolean, iconName?: string } & React.HTMLAttributes<HTMLDivElement>) {
    const [confirmed, confirmedSet] = useState(false)

    return (
        <div {...elProps} style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingS)", position: "relative", ...elProps.style }}>
            <button className='button2'
                onClick={() => {
                    confirmedSet(true)
                }}
            >
                {text}

                {iconName !== undefined && (
                    <span className="material-symbols-outlined">
                        {iconName}
                    </span>
                )}
            </button>

            {confirmed && (
                <div style={{ display: "grid", alignContent: "flex-start", gap: "var(--spacingS)", ...(float ? { position: "absolute", top: 0, right: 0, width: "min(250px, 90vw)" } : { position: "relative" }), backgroundColor: "beige", padding: "var(--spacingR)", zIndex: 999 }}>
                    <p style={{ fontSize: "var(--fontSizeS)" }}>{confirmationText}</p>

                    <div style={{ display: "flex", flexWrap: "wrap", textTransform: "capitalize" }}>
                        <button className='button2'
                            onClick={() => {
                                runAction()

                                toast.success(successMessage)

                                confirmedSet(false)
                            }}
                        >yes</button>

                        <button className='button2'
                            onClick={() => { confirmedSet(false) }}
                        >cancel</button>
                    </div>
                </div>
            )}
        </div>
    )
}
