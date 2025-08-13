import AddEditLocation from "@/components/locations/AddEditLocation"
import { ensureCanAccessResource } from "@/serverFunctions/handleAuth"
import { getSpecificLocation } from "@/serverFunctions/handleLocations"
import { characterType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: characterType["id"] }> }) {
    const { id } = await params
    const seenLocation = await getSpecificLocation(id)

    if (seenLocation === undefined) return (<p>not seeing specific character</p>)

    //auth
    await ensureCanAccessResource("locations", id)

    return (
        <main>
            <AddEditLocation sentLocation={seenLocation} />
        </main>
    )
}