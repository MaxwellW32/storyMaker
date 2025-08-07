import AddEditTag from "@/components/tags/AddEditTag"
import { getSpecificTag } from "@/serverFunctions/handleTags"
import { tagType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: tagType["id"] }> }) {
    const { id } = await params

    const seenTag = await getSpecificTag(id)
    if (seenTag === undefined) return (<p>not seeing specific id</p>)

    return (
        <main>
            <AddEditTag sentTag={seenTag} />
        </main>
    )
}