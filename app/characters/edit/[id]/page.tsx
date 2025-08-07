import AddEditCharacter from "@/components/characters/AddEditCharacter"
import { ensureCanAccessResource } from "@/serverFunctions/handleAuth"
import { getSpecificCharacter } from "@/serverFunctions/handleCharacters"
import { characterType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: characterType["id"] }> }) {
    const { id } = await params
    const seenCharacter = await getSpecificCharacter(id)

    if (seenCharacter === undefined) return (<p>not seeing specific character</p>)

    //auth
    await ensureCanAccessResource("characters", id)

    return (
        <main>
            <AddEditCharacter sentCharacter={seenCharacter} />
        </main>
    )
}