import AddEditProject from "@/components/projects/AddEditProject"
import { getSpecificProject } from "@/serverFunctions/handleProjects"
import { projectType } from "@/types"

export default async function Page({ params }: { params: Promise<{ id: projectType["id"] }> }) {
    const { id } = await params
    const seenProject = await getSpecificProject(id)

    if (seenProject === undefined) return (<p>not seeing specific project</p>)

    return (
        <AddEditProject sentProject={seenProject} />
    )
}