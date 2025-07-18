import AddEditProject from "@/components/projects/AddEditProject"
import { getSpecificProjects } from "@/serverFunctions/handleProjects"
import { projectType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: projectType["id"] }> }) {
    const { id } = await params
    const seenProject = await getSpecificProjects(id)

    if (seenProject === undefined) return (<p>not seeing specific project</p>)

    return (
        <main>
            <AddEditProject sentProject={seenProject} />
        </main>
    )
}