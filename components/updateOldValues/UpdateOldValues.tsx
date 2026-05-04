import { consoleAndToastError } from '@/useful/consoleErrorWithToast';
import React from 'react'
import toast from 'react-hot-toast';

export default function UpdateOldValues({ funcToRun }: { funcToRun: () => Promise<void> }) {
    return (
        <button className="button1"
            onClick={async () => {
                try {
                    toast.success("clicked")

                    await funcToRun()

                    toast.success("finished")

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
