import { consoleAndToastError } from '@/useful/consoleErrorWithToast';
import React from 'react'
import toast from 'react-hot-toast';

export default function UpdateOldValues() {
    return (
        <button className="button1"
            onClick={async () => {
                try {
                    toast.success("clicked")

                    console.log(`$finished`);

                } catch (error) {
                    consoleAndToastError(error)
                }
            }}
        >
            update
        </button>
    )
}
