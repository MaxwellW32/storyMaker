import AddEditEmotion from "@/components/emotions/AddEditEmotion"
import { getSpecificEmotion } from "@/serverFunctions/handleEmotions"
import { emotionType } from "@/types"

export default async function Page({ params }: { params: Promise<{ type: emotionType["type"] }> }) {
    const { type } = await params
    const seenEmotion = await getSpecificEmotion(type)

    if (seenEmotion === undefined) return (<p>not seeing specific emotion</p>)

    return (
        <main>
            <AddEditEmotion sentEmotion={seenEmotion} />
        </main>
    )
}