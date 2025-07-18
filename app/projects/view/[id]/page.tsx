import AddEditProject from "@/components/projects/AddEditProject"
import ViewProject from "@/components/projects/ViewProject"
import { getSpecificProjects } from "@/serverFunctions/handleProjects"
import { projectType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: projectType["id"] }> }) {
    const { id } = await params
    const seenProject = await getSpecificProjects(id)

    if (seenProject === undefined) return (<p>not seeing specific project to view</p>)

    return (
        <main>
            <ViewProject seenProject={seenProject} />
        </main>
    )
}